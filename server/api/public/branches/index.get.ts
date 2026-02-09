import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  return prisma.branch.findMany({
    where: {},
    select: { id: true, name: true, address: true, phone: true }
  })
})
