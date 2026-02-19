import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  return prisma.branch.findMany({
    select: { id: true, name: true, address: true, phone: true }
  })
})
