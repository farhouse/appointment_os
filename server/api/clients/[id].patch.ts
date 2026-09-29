import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { clientSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { conflict, notFound } from '~/server/utils/errors'
import { requireClientAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const id = requireParam(event, 'id')
  await requireClientAccess(u, id)
  const data = await readBodyValidated(event, clientSchema.partial())

  try {
    return await prisma.client.update({
      where: { id },
      data: {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null
      }
    })
  } catch (e: any) {
    if (e.code === 'P2025') notFound('Client not found')
    if (e.code === 'P2002') conflict('Client email or phone already exists')
    throw e
  }
})
