import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const clients = await prisma.client.findMany()
  return clients
})
