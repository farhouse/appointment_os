import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const services = await prisma.service.findMany({
    where: { active: true }
  })
  return services
})
