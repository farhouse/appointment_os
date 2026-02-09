import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const employees = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      branches: {
        include: {
          branch: true
        }
      }
    }
  })
  return employees
})
