import jwt from 'jsonwebtoken'
import { env } from '../config/env/env'

export interface JwtPayload {
  userId: number
  username: string
  email: string
}

const ACCESS_TOKEN_EXPIRES = '15m'
const REFRESH_TOKEN_EXPIRES = '7d'

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES })
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}


