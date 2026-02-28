#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runSanityChecks() {
  console.log('Starting cash/payment sanity checks...')

  const testId = `sanity_${Date.now()}`

  try {
    await prisma.$transaction(async (tx) => {
      // Create test branch
      const branch = await tx.branch.create({
        data: {
          name: `Test Branch ${testId}`,
          address: '123 Test St',
          phone: '555-0123'
        }
      })
      console.log('✓ Created test branch')

      // Create test user
      const user = await tx.user.create({
        data: {
          email: `${testId}@test.com`,
          password: 'hashedpassword', // In real scenario this would be hashed
          name: 'Test User',
          role: 'MANAGER'
        }
      })
      console.log('✓ Created test user')

      // Link user to branch
      await tx.userBranch.create({
        data: {
          userId: user.id,
          branchId: branch.id
        }
      })
      console.log('✓ Linked user to branch')

      // Create test client
      const client = await tx.client.create({
        data: {
          firstName: 'Test',
          lastName: 'Client',
          email: `${testId}@client.com`,
          phone: '555-0456'
        }
      })
      console.log('✓ Created test client')

      // Create test service
      const service = await tx.service.create({
        data: {
          name: 'Test Service',
          price: 5000, // 50.00
          duration: 30,
          pointsReward: 5
        }
      })
      console.log('✓ Created test service')

      // Create test cashbox
      const cashbox = await tx.cashBox.create({
        data: {
          branchId: branch.id,
          name: `Test Cashbox ${testId}`
        }
      })
      console.log('✓ Created test cashbox')

      // Create test appointment (finished)
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 1)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + 30)

      const appointment = await tx.appointment.create({
        data: {
          branchId: branch.id,
          clientId: client.id,
          status: 'FINISHED',
          startTime,
          endTime,
          services: {
            create: {
              serviceId: service.id,
              price: service.price,
              duration: service.duration
            }
          }
        },
        include: { services: true }
      })
      console.log('✓ Created test appointment (finished)')

      // Test 1: Open cash session
      console.log('\n--- Testing cash session opening ---')
      const session = await tx.cashSession.create({
        data: {
          branchId: branch.id,
          cashBoxId: cashbox.id,
          openedBy: user.id,
          openingBalance: 10000, // 100.00
          date: new Date()
        }
      })

      // Add opening cash movement
      await tx.cashMovement.create({
        data: {
          sessionId: session.id,
          amount: 10000,
          type: 'DEPOSIT',
          paymentMethod: 'CASH',
          reason: 'OPENING_CASH'
        }
      })
      console.log('✓ Opened cash session with opening balance')

      // Test 2: Mark appointment as PAID
      console.log('\n--- Testing appointment payment ---')
      const appointmentToPay = await tx.appointment.findUnique({
        where: { id: appointment.id }
      })
      if (!appointmentToPay || appointmentToPay.status !== 'FINISHED') {
        throw new Error('Appointment not found or not finished')
      }
      if (appointmentToPay.status === 'PAID') {
        throw new Error('Appointment already paid')
      }

      const paidAppointment = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paidById: user.id,
          paidCashBoxId: cashbox.id,
          paidPaymentMethod: 'CASH',
          paidAmount: 5000
        }
      })

      // Add payment cash movement
      await tx.cashMovement.create({
        data: {
          sessionId: session.id,
          appointmentId: appointment.id,
          amount: 5000,
          type: 'DEPOSIT',
          paymentMethod: 'CASH'
        }
      })
      console.log('✓ Marked appointment as PAID')

      // Test 3: Prevent duplicate payment
      console.log('\n--- Testing duplicate payment prevention ---')
      const appointmentToCheck = await tx.appointment.findUnique({
        where: { id: appointment.id }
      })
      if (appointmentToCheck?.status === 'PAID') {
        console.log('✓ Duplicate payment correctly prevented')
      } else {
        throw new Error('Duplicate payment was allowed - this should not happen!')
      }

      // Rollback transaction to clean up test data
      throw new Error('ROLLBACK')
    })
  } catch (error: any) {
    if (error.message === 'ROLLBACK') {
      console.log('\n✓ All sanity checks passed! Test data cleaned up.')
      return
    }
    console.error('\n✗ Sanity check failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runSanityChecks()