import { defineEventHandler, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().trim().max(30).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBodyValidated(event, schema)

  try {
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      }
    })

    return { user: updated }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Email o teléfono ya en uso' })
    }
    throw err
  }
})
