import { defineEventHandler, readMultipartFormData } from 'h3'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { badRequest } from '~/server/utils/errors'
import { resolveClientProfile } from '~/server/utils/clientProfile'

const maxPhotos = 3
const maxBytes = 5 * 1024 * 1024
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['CLIENT'])
  const client = await resolveClientProfile(u)

  const existing = await prisma.clientPhoto.count({ where: { clientId: client.id } })
  if (existing >= maxPhotos) badRequest('Photo limit reached')

  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'photo' && part.filename)
  if (!file?.data?.length || !file.filename || !file.type) badRequest('Photo file required')
  if (!allowedTypes.has(file.type)) badRequest('Unsupported image type')
  if (file.data.length > maxBytes) badRequest('Photo is too large')

  const safeExt = extname(file.filename).toLowerCase() || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg')
  const filename = `${client.id}-${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'client-photos')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), file.data)

  return prisma.clientPhoto.create({
    data: {
      clientId: client.id,
      filename,
      url: `/uploads/client-photos/${filename}`,
      mimeType: file.type,
      size: file.data.length
    }
  })
})
