import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireQueryString } from '~/server/utils/http'
import { requireBranchAccess } from '~/server/utils/branchAccess'

/**
 * Returns stock rows for a given branch.
 *
 * Important: We return *all* products, even if there's no BranchStock row yet,
 * so the UI can show quantity=0 instead of hiding missing products.
 */
export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const branchId = requireQueryString(event, 'branchId')
  await requireBranchAccess(u, branchId)

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, name: true }
  })

  if (!branch) return []

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sku: true,
      branchStock: {
        where: { branchId },
        select: { quantity: true, minStock: true }
      }
    }
  })

  return products.map((p) => {
    const existing = p.branchStock[0]
    return {
      branchId,
      productId: p.id,
      quantity: existing?.quantity ?? 0,
      minStock: existing?.minStock ?? 0,
      product: { id: p.id, name: p.name, sku: p.sku },
      branch
    }
  })
})
