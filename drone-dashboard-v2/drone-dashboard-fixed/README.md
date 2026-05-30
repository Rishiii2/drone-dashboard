# AeroDash — Drone Telemetry Dashboard

A cross-platform real-time drone monitoring dashboard built with Next.js.
Records all flight data, displays live area analysis with charts, exports to Excel,
and works on PC (Electron .exe) and Android (.apk via Capacitor).

---

## What's Fixed in This Version

| Issue | Fix |
|-------|-----|
| CORS errors blocking Android → PC connection | All API routes now send `Access-Control-Allow-Origin: *` |
| `localStorage` crashing on Android/SSR | Wrapped in safe `typeof window` guard |
| No real-time charts | Sparkline trend charts + area bar chart added |
| Settings URL not applying until reload | State + effect rewritten; reconnects immediately on save |
| Export button ignoring custom server URL | Export opens `${serverUrl}/api/export` dynamically |
| No connection status feedback | Live "Connected / Disconnected" indicator with error banner |
| No data age display | Shows "Last data: Xs ago" counter |
| SQLite opened on every request (slow) | Singleton connection — opens once, reuses |
| Excel columns had raw DB names | Human-readable headers + column widths |
| Mock drone hard-coded to localhost | Accepts IP as argument: `node mock_drone.js 192.168.1.x` |

---

## Setup

```bash
npm install
npm run dev        # development
npm run build && npm start   # production
```

---

## Connecting Your Drone

Your drone (or its ground station Raspberry Pi/laptop) sends an HTTP POST:

```
POST http://<YOUR_PC_IP>:3000/api/data
Content-Type: application/json

{
  "date": "2026-05-30",
  "time": "14:30:00",
  "water_area": 35.5,
  "path_area": 12.0,
  "vegetation_area": 320.5,
  "building_area": 45.2,
  "dry_land_area": 150.0,
  "water_abnormality": "No",
  "vegetation_abnormality": "Yes"
}
```

**Finding your PC's IP:**
- Windows: run `ipconfig` → IPv4 Address
- Mac/Linux: run `ifconfig` or check Wi-Fi settings
- Example IP: `192.168.1.100`

---

## Testing with Mock Drone (No Real Drone Needed)

```bash
# Terminal 1: start the server
npm run dev

# Terminal 2: start the simulator (same PC)
node mock_drone.js

# Or simulate from a different machine / target a specific IP:
node mock_drone.js 192.168.1.100
node mock_drone.js 192.168.1.100 3000
```

---

## Android App (.apk)

The Android app is a viewer — it connects over Wi-Fi to the PC running the server.

### Build Steps

**Requirements:** Node.js + Android Studio installed

```bash
# 1. Build the static web export
$env:BUILD_MOBILE="true"; npm run build        # Windows PowerShell
# or:
BUILD_MOBILE=true npm run build                 # Mac/Linux

# 2. Sync with Capacitor Android project
npx cap sync android

# 3. Open in Android Studio
npx cap open android
# In Android Studio: Build → Build Bundle(s)/APK(s) → Build APK(s)
```

### Using the Android App

1. Make sure PC (running server) and phone are on **the same Wi-Fi network**
2. Open AeroDash on phone → tap **⚙️ Settings**
3. Enter: `http://192.168.1.100:3000` (your PC's IP)
4. Tap **Save & Connect** — dashboard updates live

---

## Desktop App (.exe / .dmg / .AppImage)

```bash
npm run electron:build
# Output: dist/win-unpacked/AeroDash.exe  (Windows)
#         dist/mac/AeroDash.dmg           (Mac — build on Mac)
#         dist/linux/AeroDash.AppImage    (Linux — build on Linux)
```

Double-click the .exe — it starts the server automatically on port 3000 in the background.

---

## Multiple Devices (Team Use)

1. One PC runs the server (`npm start` or `AeroDash.exe`)
2. Drone sends POST data to that PC's IP
3. Everyone else (phones, tablets, laptops) opens `http://<PC_IP>:3000` in a browser
   — or uses the Android app with that IP in Settings

All devices see the same live data from the shared SQLite database.

---

## Excel Export

Click **Export Excel** on the History page.
Downloads `drone_data_YYYY-MM-DD.xlsx` with all records and human-readable column names.

