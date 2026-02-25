import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { serviceSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const data = await readBodyValidated(event, serviceSchema)

  const service = await prisma.service.create({
    data
  })

  return service
})
