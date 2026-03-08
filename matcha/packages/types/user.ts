
import { z } from 'zod'


export const userInfo = z.object({
  id: z.number(),
  username: z.string().min(2).max(50),
  email: z.email().max(255),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  bio: z.string().max(2000).nullable(),
  gender: z.enum(['male', 'female', 'other']).nullable(),
})



export const userInfoUpdate = z.object({
  id: z.number(),
  username: z.string().min(2).max(50),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  bio: z.string().max(2000).nullable(),
  gender: z.enum(['male', 'female', 'other']).nullable(),
})




export type userInfo = z.infer<typeof userInfo>
export type userInfoUpdate = z.infer<typeof userInfoUpdate>