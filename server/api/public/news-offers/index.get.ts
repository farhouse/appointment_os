import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const now = new Date()
  return prisma.newsOffer.findMany({
    where: {
      active: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } }
          ]
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
})
