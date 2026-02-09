import { defineEventHandler, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    const service = await prisma.service.update({
      where: { id },
      data: { active: false } // Soft delete
    })
    return service
  } catch (e) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Service not found',
    })
  }
})
