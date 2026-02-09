import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  return prisma.service.findMany({
    where: { active: true },
    select: { id: true, name: true, description: true, price: true, duration: true }
  })
})
