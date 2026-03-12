

import { z } from 'zod'


export const registerSchema = z.object({
  email: z.email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  username: z.string().min(3).max(50),
  password: z.string().min(8)
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
})
export type RegisterInput = z.infer<typeof registerSchema>


export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8),
})
export type LoginInput = z.infer<typeof loginSchema>




