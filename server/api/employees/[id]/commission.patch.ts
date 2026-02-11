import { defineEventHandler, createError } from 'h3'

// Not part of MVP v1.1.
export default defineEventHandler(async () => {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
})
