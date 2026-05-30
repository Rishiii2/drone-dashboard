import { getPool, initDB } from '../../lib/db';

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDB();
    const db = getPool();

    if (req.method === 'GET') {
      const result = await db.query('SELECT * FROM DroneStats ORDER BY id DESC');
      return res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      const b = req.body;
      if (!b?.date || !b?.time) {
        return res.status(400).json({ error: 'Missing required fields: date and time' });
      }
      await db.query(`
        INSERT INTO DroneStats
          (date, time, water_area, path_area, vegetation_area, building_area, dry_land_area, water_abnormality, vegetation_abnormality)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [
        b.date, b.time,
        b.water_area ?? null, b.path_area ?? null,
        b.vegetation_area ?? null, b.building_area ?? null,
        b.dry_land_area ?? null,
        b.water_abnormality ?? 'No', b.vegetation_abnormality ?? 'No'
      ]);
      return res.status(201).json({ status: 'success' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('[/api/data]', err);
    return res.status(500).json({ error: err.message });
  }
}
