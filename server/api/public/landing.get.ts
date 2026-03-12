import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const config = await prisma.landingConfig.findUnique({ where: { id: 'default' } })
  return {
    html: config?.html || ''
  }
})
