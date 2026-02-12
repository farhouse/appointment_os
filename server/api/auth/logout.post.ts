import { defineEventHandler } from 'h3'

import { clearAuthCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  clearAuthCookie(event)
  return { message: 'Logged out successfully' }
})
