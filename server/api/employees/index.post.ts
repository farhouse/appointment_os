import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { employeeSchema } from '~/server/utils/schemas'
import bcrypt from 'bcrypt'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const body = await readBody(event)
  const validation = employeeSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  const { email, password, branchIds, ...rest } = validation.data

  if (!password) {
     throw createError({
      statusCode: 400,
      statusMessage: 'Password required for new employee',
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
        branches: {
          create: branchIds?.map(id => ({ branchId: id }))
        }
      }
    })
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (e: any) {
    if (e.code === 'P2002') {
       throw createError({
        statusCode: 409,
        statusMessage: 'Email already exists',
      })
    }
    throw e
  }
})
