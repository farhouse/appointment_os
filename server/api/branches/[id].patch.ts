import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { branchUpdateSchema } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const validation = branchUpdateSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  try {
    const branch = await prisma.branch.update({
      where: { id },
      data: validation.data
    })
    return branch
  } catch (e) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Branch not found',
    })
  }
})
