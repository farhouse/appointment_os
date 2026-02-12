import { PrismaClient } from '@prisma/client'

// Prisma v7+ expects a (possibly empty) PrismaClientOptions object.
const prisma = new PrismaClient({})

export default prisma
