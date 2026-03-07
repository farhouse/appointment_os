import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export default defineEventHandler(async () => {
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, address: true, phone: true }
  })

  let todayHours: { branchId: string; startTime: string; endTime: string; isWorking: boolean }[] = []
  try {
    todayHours = await prisma.branchWorkingHour.findMany({
      where: { dayOfWeek: new Date().getDay() },
      select: { branchId: true, startTime: true, endTime: true, isWorking: true }
    })
  } catch {
    // Backward compatibility: deployments without BranchWorkingHour table keep working.
    todayHours = []
  }

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const todayHoursByBranch = new Map(todayHours.map(h => [h.branchId, h]))

  return branches.map(branch => {
    const today = todayHoursByBranch.get(branch.id)
    const isOpenNow = !!today && today.isWorking && nowMinutes >= parseTimeToMinutes(today.startTime) && nowMinutes < parseTimeToMinutes(today.endTime)

    return {
      ...branch,
      todayWorkingHours: today
        ? { start: today.startTime, end: today.endTime, isWorking: today.isWorking }
        : null,
      isOpenNow
    }
  })
})
