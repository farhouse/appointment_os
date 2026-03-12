import { defineEventHandler, createError } from 'h3'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(72),
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBodyValidated(event, schema)

  const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { id: true, password: true } })
  if (!me) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const isValid = await bcrypt.compare(body.currentPassword, me.password)
  if (!isValid) {
    throw createError({ statusCode: 400, statusMessage: 'Contraseña actual incorrecta' })
  }

  const hash = await bcrypt.hash(body.newPassword, 10)
  await prisma.user.update({ where: { id: me.id }, data: { password: hash } })

  return { ok: true }
})
