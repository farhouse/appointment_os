import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { sanitizeLandingHtml } from '~/server/utils/sanitizeLandingHtml'

export default defineEventHandler(async () => {
  const config = await prisma.landingConfig.findUnique({ where: { id: 'default' } })
  return {
    html: sanitizeLandingHtml(config?.html || '')
  }
})
