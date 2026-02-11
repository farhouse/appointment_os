import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { clientSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { conflict } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const data = await readBodyValidated(event, clientSchema)

  try {
    const client = await prisma.client.create({
      data
    })
    return client
  } catch (e: any) {
    if (e.code === 'P2002') {
      conflict('Client email or phone already exists')
    }
    throw e
  }
})
