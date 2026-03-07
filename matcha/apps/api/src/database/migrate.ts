import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/db/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

async function migrate() {
  const client = await pool.connect()

  try {
    // Create the tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    // Fetch already-applied migrations
    const { rows } = await client.query<{ name: string }>(
      'SELECT name FROM schema_migrations ORDER BY name'
    )
    const applied = new Set(rows.map((r) => r.name))

    // Read all .sql files in the migrations directory, sorted alphabetically
    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()

    const pending = files.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      console.log('No pending migrations.')
      return
    }

    for (const file of pending) {
      const filePath = path.join(MIGRATIONS_DIR, file)
      const sql = await readFile(filePath, 'utf-8')

      console.log(`Applying migration: ${file}`)

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file]
        )
        await client.query('COMMIT')
        console.log(file)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`${file} – rolled back`)
        throw err
      }
    }

    console.log(`Done. Applied ${pending.length} migration(s).`)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
