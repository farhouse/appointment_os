import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
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
