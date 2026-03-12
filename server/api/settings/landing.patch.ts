import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  html: z.string().max(50000).optional().default('')
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const { html } = await readBodyValidated(event, schema)

  const config = await prisma.landingConfig.upsert({
    where: { id: 'default' },
    update: { html },
    create: { id: 'default', html }
  })

  return { html: config.html || '' }
})
