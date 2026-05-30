import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function initDB() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS DroneStats (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      water_area REAL,
      path_area REAL,
      vegetation_area REAL,
      building_area REAL,
      dry_land_area REAL,
      water_abnormality TEXT,
      vegetation_abnormality TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
