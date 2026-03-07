import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import pool from '../../config/db'
import { ValidationErrorResponse } from '../../types/validationResponse'
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt'


const checkUniqueViolation = (error: unknown) => {

    const response: ValidationErrorResponse = {
        error: "Validation failed",
        details: { formErrors: [], fieldErrors: {} }
    };

    if (error instanceof Error && 'code' in error && 'detail' in error && error.code === '23505') {
        const detail: string = String(error.detail) || '';
        if (detail.includes('email')) {
            response.details.fieldErrors.email = ["Already taken"];
        } else if (detail.includes('username')) {
            response.details.fieldErrors.username = ["Already taken"];
        }
        return response;
    }

    return null;
};

export const authController = {

    register: async (req: Request, res: Response) => {

        try {

            const { email, username, password, firstName, lastName } = req.body;

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
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
                return;
            }
            res.status(500).json({ error: 'Internal server error' })
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
                res.status(400).json({ error: 'Invalid email or password' })
                return
            }

            const user = result.rows[0]

            const passwordMatch = await bcrypt.compare(password, user.password_hash)
            if (!passwordMatch) {
                res.status(400).json({ error: 'Invalid email or password' })
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

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            })

            res.json({
                message: 'Login successful',
                accessToken: token,
                user: {
                    email: user.email,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                },
            })
        }
        catch (err) {
            res.status(500).json({ error: 'Internal server error' })
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
            return res.status(401).json({ error: 'Invalid or expired refresh token' })
        }
    }

}