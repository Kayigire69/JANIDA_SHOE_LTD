import pg from 'pg'

const passwords = [
  'postgres',
  'admin',
  'root',
  '1234',
  '123456',
  'admin123',
  'password',
  'Hillary',
  'hillary',
  'Hillary123',
  'hillary123',
  'dev_hillary',
  'dev',
  '123',
  ''
]

async function test() {
  for (const pwd of passwords) {
    console.log(`Testing password: "${pwd}"`)
    const pool = new pg.Pool({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: pwd
    })
    
    try {
      const client = await pool.connect()
      console.log(`SUCCESS! Password is: "${pwd}"`)
      client.release()
      await pool.end()
      process.exit(0)
    } catch (err) {
      console.log(`FAILED: ${err.message}`)
      await pool.end()
    }
  }
  console.log('All standard passwords failed.')
  process.exit(1)
}

test()

