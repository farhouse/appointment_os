import { PrismaClient } from '@prisma/client'

// Prisma v7+: always pass a *non-empty* options object.
// Some Prisma client builds (eg. different engine targets) don't accept `datasources` overrides,
// so keep this conservative and compatible.
const prisma = new PrismaClient({
  log: ['error'],
})

export default prisma
