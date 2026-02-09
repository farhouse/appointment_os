import { getQuery, createError } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const branchId = q.branchId
  if (!branchId || typeof branchId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'branchId required' })
  }

  // Barber users assigned to branch
  const barbers = await prisma.user.findMany({
    where: {
      role: 'BARBER',
      active: true,
      branches: { some: { branchId } }
    },
    select: { id: true, name: true, email: true }
  })

  return barbers
})
