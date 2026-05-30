import { getPool, initDB } from '../../lib/db';

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDB();
    const db = getPool();
    const result = await db.query('SELECT * FROM DroneStats ORDER BY id DESC LIMIT 1');
    if (result.rows.length > 0) {
      return res.status(200).json(result.rows[0]);
    } else {
      return res.status(404).json({ error: 'No data yet' });
    }
  } catch (err) {
    console.error('[/api/latest]', err);
    return res.status(500).json({ error: err.message });
  }
}
