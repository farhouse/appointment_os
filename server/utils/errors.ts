import { createError } from 'h3'
import type { ZodIssue } from 'zod'

export function serverMisconfigured(statusMessage = 'Server misconfigured'): never {
  throw createError({ statusCode: 500, statusMessage })
}

export function badRequest(statusMessage = 'Bad Request', data?: unknown): never {
  throw createError({ statusCode: 400, statusMessage, ...(data === undefined ? {} : { data }) })
}

export function validationError(issues: ZodIssue[]): never {
  throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: issues })
}

export function unauthorized(statusMessage = 'Unauthorized'): never {
  throw createError({ statusCode: 401, statusMessage })
}

export function forbidden(statusMessage = 'Forbidden'): never {
  throw createError({ statusCode: 403, statusMessage })
}

export function conflict(statusMessage = 'Conflict', data?: unknown): never {
  throw createError({ statusCode: 409, statusMessage, ...(data === undefined ? {} : { data }) })
}

export function notFound(statusMessage = 'Not Found'): never {
  throw createError({ statusCode: 404, statusMessage })
}
