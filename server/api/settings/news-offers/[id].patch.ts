import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'

const schema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const id = requireParam(event, 'id')
  const data = await readBodyValidated(event, schema)

  try {
    return await prisma.newsOffer.update({
      where: { id },
      data: {
        ...('title' in data ? { title: data.title } : {}),
        ...('body' in data ? { body: data.body } : {}),
        ...('active' in data ? { active: data.active } : {}),
        ...('startsAt' in data ? { startsAt: data.startsAt ? new Date(data.startsAt) : null } : {}),
        ...('endsAt' in data ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {})
      }
    })
  } catch {
    notFound('News offer not found')
  }
})
