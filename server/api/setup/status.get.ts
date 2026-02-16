import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const count = await prisma.user.count()
  return { needsSetup: count === 0 }
})
