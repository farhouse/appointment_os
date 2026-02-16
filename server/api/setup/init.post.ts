import { defineEventHandler } from 'h3'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest, conflict } from '~/server/utils/errors'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
})

export default defineEventHandler(async (event) => {
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    badRequest('Setup already completed')
  }

  const { name, email, password } = await readBodyValidated(event, schema)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    conflict('Email already exists')
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'OWNER',
      active: true
    },
    select: { id: true, name: true, email: true, role: true }
  })

  return { user }
})
