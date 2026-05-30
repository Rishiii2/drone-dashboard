/**
 * AeroDash Mock Drone Simulator
 *
 * Usage:
 *   node mock_drone.js                              -> localhost:3000 (local dev)
 *   node mock_drone.js aerodash.onrender.com 443   -> live deployed server (HTTPS)
 *   node mock_drone.js 192.168.1.100 3000           -> another PC on local network
 */

const http = require('http');
const https = require('https');

const TARGET_HOST = process.argv[2] || '127.0.0.1';
const TARGET_PORT = parseInt(process.argv[3]) || 3000;
const USE_HTTPS = TARGET_PORT === 443 || TARGET_PORT === 8443;
const INTERVAL_MS = 3000;

console.log(`\n🚁 AeroDash Mock Drone Simulator`);
console.log(`   Target: ${USE_HTTPS ? 'https' : 'http'}://${TARGET_HOST}:${TARGET_PORT}/api/data`);
console.log(`   Sending every ${INTERVAL_MS / 1000}s\n`);

function generateMockData() {
  const now = new Date();
  const water_area = parseFloat((Math.random() * 40 + 10).toFixed(2));
  const vegetation_area = parseFloat((Math.random() * 400 + 100).toFixed(2));
  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0],
    water_area,
    path_area: parseFloat((Math.random() * 25 + 5).toFixed(2)),
    vegetation_area,
    building_area: parseFloat((Math.random() * 80 + 20).toFixed(2)),
    dry_land_area: parseFloat((Math.random() * 150 + 50).toFixed(2)),
    water_abnormality: water_area > 40 ? 'Yes' : 'No',
    vegetation_abnormality: vegetation_area < 150 ? 'Yes' : 'No'
  };
}

function sendData() {
  const payload = generateMockData();
  const body = JSON.stringify(payload);
  const lib = USE_HTTPS ? https : http;

  const req = lib.request({
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: '/api/data',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, (res) => {
    const icon = res.statusCode === 201 ? '✓' : '✗';
    console.log(`[${payload.time}] ${icon} ${res.statusCode} | water=${payload.water_area} veg=${payload.vegetation_area} water_anom=${payload.water_abnormality}`);
  });

  req.on('error', () => {
    console.error(`[${payload.time}] ✗ Cannot reach server. Is it running?`);
  });

  req.write(body);
  req.end();
}

sendData();
setInterval(sendData, INTERVAL_MS);
