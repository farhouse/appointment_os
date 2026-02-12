import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireQueryString } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  const branchId = requireQueryString(event, 'branchId')

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
