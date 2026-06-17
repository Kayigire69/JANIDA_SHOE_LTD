import pg from 'pg'
import { env } from './env.js'

export const pool = new pg.Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD
})

export const query = (text, params) => pool.query(text, params)
