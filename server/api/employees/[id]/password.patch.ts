import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import bcrypt from 'bcrypt'

const schema = z.object({ password: z.string().min(6) })

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  const hash = await bcrypt.hash(parsed.data.password, 10)
  return prisma.user.update({ where: { id }, data: { password: hash } })
})
