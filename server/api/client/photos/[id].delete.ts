import { defineEventHandler } from 'h3'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'
import { resolveClientProfile } from '~/server/utils/clientProfile'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['CLIENT'])
  const client = await resolveClientProfile(u)
  const id = requireParam(event, 'id')

  const photo = await prisma.clientPhoto.findFirst({
    where: { id, clientId: client.id }
  })
  if (!photo) notFound('Photo not found')

  await prisma.clientPhoto.delete({ where: { id: photo.id } })

  try {
    await unlink(join(process.cwd(), 'public', photo.url.replace(/^\//, '')))
  } catch {
    // Metadata is authoritative; ignore missing local files.
  }

  return { success: true }
})
