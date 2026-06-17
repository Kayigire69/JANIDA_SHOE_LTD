import app from './app.js'
import { env } from './config/env.js'
import { pool } from './config/db.js'
import { runMigrations } from './db/migrate.js'

const startServer = async () => {
  try {
    console.log('Running database migrations...')
    await runMigrations()
    console.log('Database migrations completed.')
    
    const server = app.listen(env.PORT, () => {
      console.log(`Smart Shoe Backend running on port ${env.PORT}`)
    })

    const shutdown = async () => {
      server.close(async () => {
        await pool.end()
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
