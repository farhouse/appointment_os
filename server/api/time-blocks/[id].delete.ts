import { defineEventHandler, createError } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })

  const block = await prisma.timeBlock.findUnique({ where: { id } })
  if (!block) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  // Authorization
  if (user.role === 'BARBER') {
    if (block.professionalId !== user.userId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  } else if (['MANAGER', 'ADMIN', 'OWNER'].includes(user.role)) {
    // Allowed
  } else {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await prisma.timeBlock.delete({ where: { id } })

  return { success: true }
})
