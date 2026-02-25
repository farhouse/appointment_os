import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'

import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])
  const id = requireParam(event, 'id')

  try {
    const service = await prisma.service.update({
      where: { id },
      data: { active: false } // Soft delete
    })
    return service
  } catch (e) {
    notFound('Service not found')
  }
})
