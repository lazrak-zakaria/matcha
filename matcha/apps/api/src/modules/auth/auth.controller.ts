import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import pool from '../../config/db'
import { ValidationErrorResponse } from '../../types/validationResponse'
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt'
import { env } from '../../config/env/env'


export const checkUniqueViolation = (error: unknown) => {

    const response: ValidationErrorResponse = {
        message: "Validation failed",
        details: { formErrors: [], fieldErrors: {} }
    };

    if (error instanceof Error && 'code' in error && 'detail' in error && error.code === '23505') {
        const detail: string = String(error.detail) || '';
        if (detail.includes('email')) {
            response.details.fieldErrors.email = "email already exists";
        } else if (detail.includes('username')) {
            response.details.fieldErrors.username = "username already exists";
        }
        return response;
    }

    return null;
};

export const authController = {

    register: async (req: Request, res: Response) => {

        try {

            const { email, username, password, firstName, lastName } = req.body;

            const saltRounds = env.BCRYPT_SALT_ROUNDS;
            const hashedPassword = await bcrypt.hash(password, saltRounds)


            const result = await pool.query(
                'INSERT INTO users (email, username, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5)',
                [email, username, hashedPassword, firstName, lastName]
            )

            res.status(201).json(
                {
                    message: 'User registered successfully',
                    user: {
                        email,
                        username,
                        firstName,
                        lastName,
                    }
                })
        }
        catch (err) {
            const uniqueViolation = checkUniqueViolation(err);
            if (uniqueViolation) {
                res.status(400).json(uniqueViolation);
                console.error("Unique constraint violation:", uniqueViolation);
                return;
            }
            console.error("Registration error:", err);
            res.status(500).json({ message: 'Internal server error' })
        }

    }
    ,
    login: async (req: Request, res: Response) => {

        try {
            const { email, password } = req.body

            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            )

            if (result.rows.length === 0) {
                res.status(400).json({ message: 'Invalid email or password' })
                return
            }

            const user = result.rows[0]

            const passwordMatch = await bcrypt.compare(password, user.password_hash)
            if (!passwordMatch) {
                res.status(400).json({ message: 'Invalid email or password' })
                return
            }

            const token = signAccessToken({
                userId: user.id,
                username: user.username,
                email: user.email,
            })

            const refreshToken = signRefreshToken({
                userId: user.id,
                username: user.username,
                email: user.email,
            })

            const avatar = await pool.query(
                'SELECT * FROM images WHERE user_id = $1 AND is_avatar = true',
                [user.id]
            )

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/api/auth/refresh-token', // Only send cookie to refresh token endpoint
            })

            res.json({
                message: 'Login successful',
                accessToken: token,
                user: {
                    userId: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    bio: user.bio,
                    age: user.age,
                    gender: user.gender,
                    avatar: avatar.rows[0]?.url || null,
                },
            })
        }
        catch (err) {
            res.status(500).json({ message: 'Internal server error' })
        }
    }
    ,
    refreshToken: async (req: Request, res: Response) => {

        try {

            const refreshToken = req.cookies.refreshToken;

            const payload = verifyToken(refreshToken)

            const token = signAccessToken({
                userId: payload.userId,
                username: payload.username,
                email: payload.email,
            })

            res.json({
                message: 'access token generated successfully',
                accessToken: token,
            })
        }
        catch (err) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' })
        }
    }

}