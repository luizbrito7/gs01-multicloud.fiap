const express = require('express')
const cors = require('cors')
const { pool, ensureSchema, seed } = require('./db')

const PORT = parseInt(process.env.PORT || '3000', 10)
const CLOUD = process.env.CLOUD_NAME || 'unknown'

const app = express()
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true, cloud: CLOUD })
})

app.get('/api/subjects', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, completed, created_at FROM subjects ORDER BY created_at ASC'
    )
    res.json({ data: rows, cloud: CLOUD })
  } catch (err) {
    console.error('[GET /api/subjects]', err)
    res.status(500).json({ error: 'internal error', cloud: CLOUD })
  }
})

app.post('/api/subjects', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) {
      return res.status(400).json({ error: 'name is required', cloud: CLOUD })
    }
    const { rows } = await pool.query(
      'INSERT INTO subjects (name) VALUES ($1) RETURNING id, name, completed, created_at',
      [name]
    )
    res.status(201).json({ data: rows[0], cloud: CLOUD })
  } catch (err) {
    console.error('[POST /api/subjects]', err)
    res.status(500).json({ error: 'internal error', cloud: CLOUD })
  }
})

app.patch('/api/subjects/:id', async (req, res) => {
  try {
    const { rows, rowCount } = await pool.query(
      'UPDATE subjects SET completed = NOT completed WHERE id = $1 RETURNING id, name, completed, created_at',
      [req.params.id]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'not found', cloud: CLOUD })
    }
    res.json({ data: rows[0], cloud: CLOUD })
  } catch (err) {
    console.error('[PATCH /api/subjects/:id]', err)
    res.status(500).json({ error: 'internal error', cloud: CLOUD })
  }
})

app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM subjects WHERE id = $1',
      [req.params.id]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'not found', cloud: CLOUD })
    }
    res.json({ cloud: CLOUD })
  } catch (err) {
    console.error('[DELETE /api/subjects/:id]', err)
    res.status(500).json({ error: 'internal error', cloud: CLOUD })
  }
})

async function main() {
  await ensureSchema()
  await seed()

  const server = app.listen(PORT, () => {
    console.log(`[server] listening on :${PORT} cloud=${CLOUD}`)
  })

  const shutdown = (signal) => {
    console.log(`[server] received ${signal}, shutting down`)
    const force = setTimeout(() => {
      console.error('[server] shutdown timeout, forcing exit')
      process.exit(1)
    }, 10_000)
    force.unref()

    server.close(async () => {
      try {
        await pool.end()
        console.log('[server] clean shutdown')
        process.exit(0)
      } catch (err) {
        console.error('[server] error during shutdown', err)
        process.exit(1)
      }
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((err) => {
  console.error('[server] fatal startup error', err)
  process.exit(1)
})
