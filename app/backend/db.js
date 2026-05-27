const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL is required')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
})

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`

const SEED_SUBJECTS = [
  'Cloud Advanced Engineering',
  'Cloud Artificial Intelligence',
  'Cloud Database',
  'Cloud Native Development',
  'Cloud Security',
  'DevOps CI CD',
  'IT Governance',
  'Private Cloud',
]

async function ensureSchema() {
  await pool.query(SCHEMA)
}

async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM subjects')
  if (rows[0].count > 0) {
    console.log('[db] table already populated')
    return
  }
  for (const name of SEED_SUBJECTS) {
    await pool.query('INSERT INTO subjects (name) VALUES ($1)', [name])
  }
  console.log(`[db] seeded ${SEED_SUBJECTS.length} rows`)
}

module.exports = { pool, ensureSchema, seed }
