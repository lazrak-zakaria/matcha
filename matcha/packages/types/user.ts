
import { z } from 'zod'


export const userInfo = z.object({
  id: z.number(),
  username: z.string().min(2).max(50),
  email: z.email().max(255),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100)
})
export type userInfo = z.infer<typeof userInfo>