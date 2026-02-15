import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function ensureBranch() {
  const existing = await prisma.branch.findFirst({ where: { name: 'Emi Barber Club' } })
  if (existing) return existing

  return prisma.branch.create({
    data: {
      name: 'Emi Barber Club',
      address: 'Av. Siempre Viva 123',
      phone: '+54 11 5555-5555'
    }
  })
}

async function upsertUser(params: {
  email: string
  phone?: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT'
  passwordPlain: string
  branchId?: string
}) {
  const password = await bcrypt.hash(params.passwordPlain, 10)

  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
      active: true,
      ...(params.phone ? { phone: params.phone } : {})
    },
    create: {
      email: params.email,
      phone: params.phone,
      name: params.name,
      password,
      role: params.role,
      active: true
    }
  })

  if (params.branchId && params.role !== 'CLIENT') {
    await prisma.userBranch.upsert({
      where: { userId_branchId: { userId: user.id, branchId: params.branchId } },
      update: {},
      create: { userId: user.id, branchId: params.branchId }
    })
  }

  return user
}

async function ensureService() {
  const existing = await prisma.service.findFirst({ where: { name: 'Corte Clásico' } })
  if (existing) return existing

  return prisma.service.create({
    data: {
      name: 'Corte Clásico',
      description: 'Corte clásico con tijera y máquina',
      price: 15000,
      duration: 30,
      active: true
    }
  })
}

async function ensureClientRecord() {
  // Separate from User CLIENT; this is for legacy/booking without account.
  const email = 'cliente@example.com'
  const phone = '+54 11 6000-0000'

  const existing = await prisma.client.findFirst({
    where: { OR: [{ email }, { phone }] }
  })
  if (existing) return existing

  return prisma.client.create({
    data: {
      firstName: 'Cliente',
      lastName: 'Demo',
      email,
      phone
    }
  })
}

async function main() {
  console.log('Start seeding ...')

  const branch = await ensureBranch()
  console.log(`Branch: ${branch.name} (${branch.id})`)

  // Credentials requested for testing (email / password = 1234)
  const admin = await upsertUser({
    email: 'admin@emi.local',
    phone: '+54 11 7000-0001',
    name: 'Admin',
    role: 'ADMIN',
    passwordPlain: '1234',
    branchId: branch.id
  })
  console.log(`User: ${admin.email} (${admin.role})`)

  const manager = await upsertUser({
    email: 'manager@emi.local',
    phone: '+54 11 7000-0002',
    name: 'Manager',
    role: 'MANAGER',
    passwordPlain: '1234',
    branchId: branch.id
  })
  console.log(`User: ${manager.email} (${manager.role})`)

  const barber = await upsertUser({
    email: 'barber@emi.local',
    phone: '+54 11 7000-0003',
    name: 'Barbero Demo',
    role: 'BARBER',
    passwordPlain: '1234',
    branchId: branch.id
  })
  console.log(`User: ${barber.email} (${barber.role})`)

  const clientUser = await upsertUser({
    email: 'client@emi.local',
    phone: '+54 11 7000-0004',
    name: 'Cliente Demo',
    role: 'CLIENT',
    passwordPlain: '1234'
  })
  console.log(`User: ${clientUser.email} (${clientUser.role})`)

  const service = await ensureService()
  console.log(`Service: ${service.name} (${service.id})`)

  const client = await ensureClientRecord()
  console.log(`Client: ${client.firstName} (${client.id})`)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
