import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  // Demo credentials use 1234; enforce basic length without blocking.
  password: z.string().min(4),
})

export const branchSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export const branchUpdateSchema = branchSchema.partial()

export const employeeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'BARBER', 'CLIENT']),
  password: z.string().min(6).optional(), // Optional for updates if logic handles it
  active: z.boolean().optional(),
  branchIds: z.array(z.string()).optional()
})

export const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  active: z.boolean().optional(),
})

export const clientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export const appointmentSchema = z.object({
  branchId: z.string().uuid(),
  clientId: z.string().uuid(),
  professionalId: z.string().uuid().optional(),
  startTime: z.string().datetime(), // ISO string
  endTime: z.string().datetime(),
  serviceIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
})

export const appointmentUpdateSchema = appointmentSchema.partial().extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'PAID', 'CANCELED', 'NO_SHOW']).optional()
})
