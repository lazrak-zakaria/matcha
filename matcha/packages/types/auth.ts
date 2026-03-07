

import { z } from 'zod'


export const registerSchema = z.object({
  email: z.email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
})
export type RegisterInput = z.infer<typeof registerSchema>


export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8),
})
export type LoginInput = z.infer<typeof loginSchema>




