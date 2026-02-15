import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { employeeSchema } from '~/server/utils/schemas'
import bcrypt from 'bcrypt'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest, conflict } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const { email, password, branchIds, ...rest } = await readBodyValidated(event, employeeSchema)

  if (!password) {
    badRequest('Password required for new employee')
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
      conflict('Email already exists')
    }
    throw e
  }
})
