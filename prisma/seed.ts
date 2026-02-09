import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Create Branch
  const branch = await prisma.branch.create({
    data: {
      name: 'Main Branch',
      address: '123 Barber St',
      phone: '555-0100',
    },
  })
  console.log(`Created branch: ${branch.name}`)

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barberos.com' },
    update: {},
    create: {
      email: 'admin@barberos.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      branches: {
        create: {
          branchId: branch.id
        }
      }
    },
  })
  console.log(`Created user: ${admin.email}`)

  // Create Barber
  const barberPassword = await bcrypt.hash('barber123', 10)
  const barber = await prisma.user.upsert({
    where: { email: 'barber@barberos.com' },
    update: {},
    create: {
      email: 'barber@barberos.com',
      name: 'John Barber',
      password: barberPassword,
      role: 'BARBER',
      branches: {
        create: {
          branchId: branch.id
        }
      }
    },
  })
  console.log(`Created user: ${barber.email}`)

  // Create Service
  const service = await prisma.service.create({
    data: {
      name: 'Standard Haircut',
      description: 'Regular haircut with scissors and clippers',
      price: 30.00,
      duration: 30,
    }
  })
  console.log(`Created service: ${service.name}`)

  // Create Client
  const client = await prisma.client.create({
    data: {
      firstName: 'Test',
      lastName: 'Client',
      email: 'client@example.com',
      phone: '555-5555',
    }
  })
  console.log(`Created client: ${client.firstName}`)

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
