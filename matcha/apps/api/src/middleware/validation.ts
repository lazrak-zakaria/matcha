import type { Request, Response, NextFunction } from 'express'
import { ZodType , ZodError, z } from 'zod'


export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          details: z.flattenError(error),
        })
      }
      next(error)
    }
  }
}


export const hasRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ error: 'Missing refresh token' })
  }
  next()
}