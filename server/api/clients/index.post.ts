import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { clientSchema } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = clientSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  try {
    const client = await prisma.client.create({
      data: validation.data
    })
    return client
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Client email or phone already exists',
      })
    }
    throw e
  }
})
