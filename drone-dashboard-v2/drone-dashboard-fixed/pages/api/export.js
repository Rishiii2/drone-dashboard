import { getPool } from '../../lib/db';
import * as xlsx from 'xlsx';

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const db = getPool();
    const result = await db.query('SELECT * FROM DroneStats ORDER BY id ASC');

    const formatted = result.rows.map(row => ({
      'ID': row.id,
      'Date': row.date,
      'Time': row.time,
      'Water Area (sq m)': row.water_area,
      'Path Area (sq m)': row.path_area,
      'Vegetation Area (sq m)': row.vegetation_area,
      'Building Area (sq m)': row.building_area,
      'Dry Land Area (sq m)': row.dry_land_area,
      'Water Abnormality': row.water_abnormality,
      'Vegetation Abnormality': row.vegetation_abnormality,
      'Recorded At': row.created_at
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(formatted);
    ws['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 16 },
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 22 }
    ];
    xlsx.utils.book_append_sheet(wb, ws, 'DroneStats');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `drone_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.status(200).send(buf);
  } catch (err) {
    console.error('[/api/export]', err);
    return res.status(500).json({ error: err.message });
  }
}
