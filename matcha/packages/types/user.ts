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

export const userAccountUpdate = z.object({
  username: z.string().min(2).max(50),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
})

export const userProfileUpdate = z.object({
  age: z.number().int().positive(),
  bio: z.string().max(2000),
  gender: z.enum(['male', 'female', 'other'])
})


export const userPasswordUpdate = z.object({
    currentPassword: z.string().min(8, { message: "Password must be at least 8 characters." })
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character",
        ),
    newPassword: z.string().min(8, { message: "Password must be at least 8 characters." })
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character",
        )
});

export type userInfo = z.infer<typeof userInfo>
export type userInfoUpdate = z.infer<typeof userInfoUpdate>
export type userAccountUpdate = z.infer<typeof userAccountUpdate>
export type userProfileUpdate = z.infer<typeof userProfileUpdate>
export type userPasswordUpdate = z.infer<typeof userPasswordUpdate>