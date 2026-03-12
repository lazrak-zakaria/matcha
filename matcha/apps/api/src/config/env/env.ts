import { env as loadEnv } from 'custom-env'
import { coerce, z } from 'zod'

loadEnv()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  APP_STAGE: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('matcha'),
  DB_PASSWORD: z.string().default('matcha'),
  DB_NAME: z.string().default('matcha'),



  ACCESS_TOKEN_EXPIRES: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES: z.string().default('7d'),
  WEB_URL: z.string().default('http://localhost:3000'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment variables');
  process.exit(1)
}

const env = parsedEnv.data

export default env
export {env}

