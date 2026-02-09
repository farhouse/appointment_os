import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const bookings = await prisma.booking.findMany({
      orderBy: {
        start: 'asc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    // Transform for FullCalendar if needed, or keep raw
    return bookings
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const booking = await prisma.booking.create({
      data: {
        title: body.title,
        start: new Date(body.start),
        end: new Date(body.end),
        userName: body.userName,
        // Optional: link to user if logged in
        // userId: ...
      }
    })
    return booking
  }
})
