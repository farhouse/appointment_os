import { defineEventHandler } from 'h3'

import { notFound } from '~/server/utils/errors'

// Not part of MVP v1.1.
export default defineEventHandler(async () => {
  notFound('Not Found')
})
