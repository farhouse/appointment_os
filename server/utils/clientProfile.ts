import prisma from '~/server/utils/prisma'
import { notFound } from '~/server/utils/errors'
import type { AuthUser } from '~/server/utils/auth'

export async function resolveClientProfile(u: AuthUser) {
  const user = await prisma.user.findUnique({
    where: { id: u.userId },
    select: {
      clientId: true,
      email: true
    }
  })

  if (!user) notFound('Client profile not found')

  if (user.clientId) {
    const client = await prisma.client.findUnique({ where: { id: user.clientId } })
    if (client) return client
  }

  if (user.email) {
    const client = await prisma.client.findFirst({ where: { email: user.email } })
    if (client) {
      await prisma.user.update({
        where: { id: u.userId },
        data: { clientId: client.id }
      })
      return client
    }
  }

  notFound('Client profile not found')
}
