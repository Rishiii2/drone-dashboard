import { getPool } from '../../lib/db';

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).end();

  try {
    const db = getPool();
    await db.query('DELETE FROM DroneStats');
    return res.status(200).json({ status: 'success', message: 'All records deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
