import { PrismaClient } from '@prisma/client'

// Prisma v7+: pass an explicit options object.
// Also wire DATABASE_URL explicitly to avoid any env-resolution edge cases in containers.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

export default prisma
