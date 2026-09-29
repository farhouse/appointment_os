import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { badRequest, notFound } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().nonnegative(), // 0 means remove? Or just filter out 0s
})

const schema = z.object({
  items: z.array(itemSchema)
})

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const id = requireParam(event, 'id')
  const { items: requestedItems } = await readBodyValidated(event, schema)

  // Transaction to handle everything atomically
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch appointment
    const appointment = await tx.appointment.findUnique({
      where: { id },
      include: {
        branch: true,
        sale: {
          include: { items: true }
        }
      }
    })

    if (!appointment) notFound('Appointment not found')
    await requireBranchAccess(u, appointment.branchId)
    
    // Check if sale is already paid (if paymentMethod is set)
    if (appointment.sale?.paymentMethod) {
      badRequest('Cannot modify sale items for a paid appointment/sale')
    }

    const branchId = appointment.branchId

    // 2. Calculate existing quantities in the sale (to revert stock or calc diff)
    const existingQuantities = new Map<string, number>()
    if (appointment.sale) {
      for (const item of appointment.sale.items) {
        if (item.productId) {
          existingQuantities.set(item.productId, (existingQuantities.get(item.productId) || 0) + item.quantity)
        }
      }
    }

    // 3. Calculate new quantities from request
    const newQuantities = new Map<string, number>()
    // Filter out items with quantity 0
    const validItems = requestedItems.filter(i => i.quantity > 0)
    
    for (const item of validItems) {
      newQuantities.set(item.productId, (newQuantities.get(item.productId) || 0) + item.quantity)
    }

    // 4. Determine Stock Diffs (What to add/remove from stock)
    // Positive diff means we need MORE stock (Decrement DB stock)
    // Negative diff means we are returning stock (Increment DB stock)
    const stockAdjustments = new Map<string, number>()
    const allProductIds = new Set([...existingQuantities.keys(), ...newQuantities.keys()])

    for (const productId of allProductIds) {
      const oldQty = existingQuantities.get(productId) || 0
      const newQty = newQuantities.get(productId) || 0
      const diff = newQty - oldQty
      if (diff !== 0) {
        stockAdjustments.set(productId, diff)
      }
    }

    // 5. Check and Apply Stock Adjustments
    for (const [productId, diff] of stockAdjustments.entries()) {
      if (diff > 0) {
        // Need to take 'diff' from stock. Check availability.
        const stock = await tx.branchStock.findUnique({
          where: { branchId_productId: { branchId, productId } }
        })
        const currentStock = stock?.quantity || 0
        if (currentStock < diff) {
          const product = await tx.product.findUnique({ where: { id: productId } })
          badRequest(`Insufficient stock for product: ${product?.name || productId}. Available: ${currentStock}, Required: ${diff}`)
        }

        // Decrement stock
        await tx.branchStock.upsert({
          where: { branchId_productId: { branchId, productId } },
          update: { quantity: { decrement: diff } },
          create: { branchId, productId, quantity: -diff } // Should not happen if check passes, but for safety
        })

        // Log Stock Movement (OUT)
        await tx.stockMovement.create({
          data: {
            branchId,
            type: 'OUT',
            reference: `APT-SALE:${id}`,
            items: {
              create: [{ productId, quantity: diff }]
            }
          }
        })

      } else {
        // diff is negative (e.g. -2). We are returning 2 items to stock.
        const qtyToReturn = Math.abs(diff)
        
        // Increment stock
        await tx.branchStock.upsert({
          where: { branchId_productId: { branchId, productId } },
          update: { quantity: { increment: qtyToReturn } },
          create: { branchId, productId, quantity: qtyToReturn }
        })

        // Log Stock Movement (IN/ADJUSTMENT or implicit return)
        // Let's use IN or ADJUSTMENT. 'IN' usually means purchase. 
        // Maybe better to reuse 'OUT' with negative quantity? No, usually positive quantities.
        // Let's use 'ADJUSTMENT' or just implicit return. 
        // Since we are "cancelling" a sale item, it's effectively an "IN".
        await tx.stockMovement.create({
          data: {
            branchId,
            type: 'IN', // Returning to stock
            reference: `APT-SALE-RETURN:${id}`,
            items: {
              create: [{ productId, quantity: qtyToReturn }]
            }
          }
        })
      }
    }

    // 6. Update/Create Sale Record
    // We need product details (price) for new items
    const productDetails = await tx.product.findMany({
      where: { id: { in: Array.from(newQuantities.keys()) } }
    })
    const productMap = new Map(productDetails.map(p => [p.id, p]))

    const total = validItems.reduce((acc, item) => {
      const p = productMap.get(item.productId)
      return acc + (Number(p?.price || 0) * item.quantity)
    }, 0)

    if (appointment.sale) {
      // Update existing sale
      // Remove all items and re-add (simplest to handle updates)
      await tx.saleItem.deleteMany({ where: { saleId: appointment.sale.id } })

      // If no items left, should we delete the sale? 
      // Maybe not, keeping an empty sale linked to appointment is fine, or delete it.
      // If total is 0 and no items, let's delete the sale to keep it clean.
      if (validItems.length === 0) {
        await tx.sale.delete({ where: { id: appointment.sale.id } })
        return null
      } else {
        const updatedSale = await tx.sale.update({
          where: { id: appointment.sale.id },
          data: {
            total,
            items: {
              create: validItems.map(item => {
                const p = productMap.get(item.productId)!
                return {
                  productId: item.productId,
                  name: p.name,
                  quantity: item.quantity,
                  price: p.price
                }
              })
            }
          },
          include: { items: true }
        })
        return updatedSale
      }

    } else {
      // Create new sale
      if (validItems.length === 0) return null

      const newSale = await tx.sale.create({
        data: {
          branchId,
          clientId: appointment.clientId,
          userId: u.userId, // Who added the items
          total,
          appointmentId: id,
          // paymentMethod is NULL (pending)
          items: {
            create: validItems.map(item => {
              const p = productMap.get(item.productId)!
              return {
                productId: item.productId,
                name: p.name,
                quantity: item.quantity,
                price: p.price
              }
            })
          }
        },
        include: { items: true }
      })
      return newSale
    }
  })

  return result
})
