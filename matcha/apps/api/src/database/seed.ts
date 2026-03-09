import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/db/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEEDS_DIR = path.join(__dirname, 'seeds')

async function seed() {
  const client = await pool.connect()

  try {
    // Read all .sql files in the seeds directory, sorted alphabetically
    const files = (await readdir(SEEDS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()

    if (files.length === 0) {
      console.log('No seed files found.')
      return
    }

    for (const file of files) {
      const filePath = path.join(SEEDS_DIR, file)
      const sql = await readFile(filePath, 'utf-8')

      console.log(`Running seed: ${file}`)

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('COMMIT')
        console.log(`✓ ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`✗ ${file} – rolled back`)
        throw err
      }
    }

    console.log('Seeding complete.')
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
