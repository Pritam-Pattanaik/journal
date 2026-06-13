import dotenv from 'dotenv';
dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import pkg from 'pg';
const { Pool } = pkg;

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS coach_memory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pattern_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      count INTEGER NOT NULL DEFAULT 0,
      previous_count INTEGER NOT NULL DEFAULT 0,
      avg_pnl NUMERIC,
      detected_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const r = await client.query('SELECT COUNT(*) FROM coach_memory');
  console.log('coach_memory table ready. Rows:', r.rows[0].count);

  client.release();
  await pool.end();
})();
