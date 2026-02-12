import { getQuery, getRouterParam, readBody } from 'h3'
import type { H3Event } from 'h3'
import { z } from 'zod'
import type { ZodTypeAny } from 'zod'

import { badRequest, validationError } from '~/server/utils/errors'

export async function readBodyValidated<TSchema extends ZodTypeAny>(
  event: H3Event,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) validationError(parsed.error.issues)
  return parsed.data as z.infer<TSchema>
}

export function requireParam(event: H3Event, name: string): string {
  const value = getRouterParam(event, name)
  if (!value) badRequest(`${name} required`)
  return value
}

export function requireQueryString(event: H3Event, name: string): string {
  const q = getQuery(event)
  const value = q[name]
  if (typeof value !== 'string' || value.length === 0) badRequest(`${name} required`)
  return value
}
