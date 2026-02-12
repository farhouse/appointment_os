import { deleteCookie, getCookie, setCookie } from 'h3'
import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { Prisma, Role } from '@prisma/client'

import { serverMisconfigured, unauthorized } from '~/server/utils/errors'

export const AUTH_COOKIE_NAME = 'auth_token'
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

const accessTokenPayloadSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role),
  email: z.string().email().optional(),
})

const refreshTokenPayloadSchema = z.object({
  userId: z.string().min(1),
})

export type AuthUser = z.infer<typeof accessTokenPayloadSchema>
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) serverMisconfigured('Server misconfigured')
  return secret
}

function getJwtRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || getJwtSecret()
}

export function getAuthCookie(event: H3Event): string | undefined {
  return getCookie(event, AUTH_COOKIE_NAME)
}

export function setAuthCookie(event: H3Event, accessToken: string): void {
  setCookie(event, AUTH_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  })
}

export function clearAuthCookie(event: H3Event): void {
  deleteCookie(event, AUTH_COOKIE_NAME, { path: '/' })
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL_SECONDS })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, getJwtRefreshSecret(), { expiresIn: REFRESH_TOKEN_TTL_SECONDS })
}

export function verifyAccessToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] })
    const parsed = accessTokenPayloadSchema.safeParse(decoded)
    if (!parsed.success) unauthorized('Invalid token')
    return parsed.data
  } catch {
    unauthorized('Invalid token')
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, getJwtRefreshSecret(), { algorithms: ['HS256'] })
    const parsed = refreshTokenPayloadSchema.safeParse(decoded)
    if (!parsed.success) unauthorized('Invalid refresh token')
    return parsed.data
  } catch {
    unauthorized('Invalid refresh token')
  }
}
