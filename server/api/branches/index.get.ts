import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const branches = await prisma.branch.findMany()
  return branches
})
