import { defineEventHandler, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import bcrypt from 'bcrypt'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({ password: z.string().min(6) })

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const parsed = await readBodyValidated(event, schema)

  const hash = await bcrypt.hash(parsed.password, 10)
  return prisma.user.update({ where: { id }, data: { password: hash } })
})
