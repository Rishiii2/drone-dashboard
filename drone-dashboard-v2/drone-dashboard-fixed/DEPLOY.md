# AeroDash — Deployment Guide (15 minutes)

Follow these 4 steps in order. You only do this once.

---

## Step 1 — Get a free cloud database (Neon)

1. Go to https://neon.tech and click **Sign Up** (free, use Google)
2. Click **Create Project** → name it `aerodash` → click Create
3. On the dashboard, find **Connection String** and click **Copy**
   - It looks like: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
4. **Save this string** — you'll paste it in Step 3

---

## Step 2 — Push your code to GitHub

1. Go to https://github.com and sign in (or sign up free)
2. Click **+** → **New repository** → name it `drone-dashboard` → **Create repository**
3. Open Command Prompt in your project folder and run these commands one by one:

```cmd
git init
git add .
git commit -m "initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/drone-dashboard.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

> If git is not installed: https://git-scm.com/download/win — install it, then restart cmd.

---

## Step 3 — Deploy on Render

1. Go to https://render.com and click **Get Started for Free** (use Google)
2. Click **New +** → **Web Service**
3. Click **Connect a repository** → select your `drone-dashboard` repo
4. Fill in the settings:
   - **Name:** aerodash
   - **Region:** pick closest to you
   - **Branch:** main
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Scroll down to **Environment Variables** → click **Add Environment Variable**:
   - **Key:** `DATABASE_URL`
   - **Value:** paste your Neon connection string from Step 1
6. Click **Create Web Service**

Render will now build and deploy. Takes about 3-5 minutes.
When it says **"Your service is live"** you'll see a URL like:
```
https://aerodash.onrender.com
```

That's your live dashboard — accessible from anywhere in the world!

---

## Step 4 — Test it

1. Open `https://aerodash.onrender.com` in your browser
2. Open a second Command Prompt in your project folder and run:
   ```cmd
   node mock_drone.js aerodash.onrender.com 443
   ```
   > This sends test data to the live server so you can verify it works.
3. Watch the dashboard update with live data

---

## Connecting Your Real Drone

Once deployed, your drone sends data to:
```
POST https://aerodash.onrender.com/api/data
```

Same JSON format as before:
```json
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

No IP address needed — it works from anywhere over the internet.

---

## Using on Your Phone

Just open `https://aerodash.onrender.com` in Chrome on your phone.
Tap **three dots → Add to Home Screen** to install it like an app.
Works on any device, anywhere, no Wi-Fi restrictions.

---

## Important: Render Free Tier Note

Render's free tier **sleeps after 15 minutes of no traffic**.
The first request after sleep takes ~30 seconds to wake up — this is normal.

To keep it always awake, upgrade to Render's $7/month plan,
or use a free uptime monitor like https://uptimerobot.com to ping it every 10 minutes.

---

## Resetting Data

Go to the **History** page and click **🗑 Reset Data**.
This permanently deletes all records from the cloud database.

