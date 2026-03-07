import pg from 'pg'
import { env } from '../env/env'

const { Pool } = pg

const pool = new Pool({
  host: env.DB_HOST ,
  port: env.DB_PORT ,
  user: env.DB_USER ,
  password: env.DB_PASSWORD ,
  database: env.DB_NAME ,
})

export default pool
export { pool }
