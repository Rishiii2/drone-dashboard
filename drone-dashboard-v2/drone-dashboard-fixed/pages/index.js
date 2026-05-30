import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// Safe localStorage wrapper - works on Android/SSR without crashing
const storage = {
  get: (key, fallback = '') => {
    if (typeof window === 'undefined') return fallback;
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set: (key, val) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, val); } catch {}
  }
};

// Mini sparkline chart component (pure SVG, no dependencies)
function Sparkline({ data, color = '#3b82f6', height = 40 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// Bar chart for area breakdown
function AreaBarChart({ data }) {
  if (!data) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Waiting for data...</p>;
  const fields = [
    { key: 'water_area', label: 'Water', color: '#3b82f6' },
    { key: 'path_area', label: 'Path', color: '#f59e0b' },
    { key: 'vegetation_area', label: 'Vegetation', color: '#10b981' },
    { key: 'building_area', label: 'Building', color: '#8b5cf6' },
    { key: 'dry_land_area', label: 'Dry Land', color: '#ef4444' },
  ];
  const vals = fields.map(f => parseFloat(data[f.key]) || 0);
  const total = vals.reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
      {fields.map((f, i) => (
        <div key={f.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{f.label}</span>
            <span style={{ color: f.color, fontSize: '0.8rem', fontWeight: 600 }}>
              {vals[i].toFixed(1)} m²
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(vals[i] / total) * 100}%`,
              background: f.color,
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [lastUsed, setLastUsed] = useState('Loading...');
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [tempUrl, setTempUrl] = useState('');
  const [connStatus, setConnStatus] = useState('connecting'); // 'connected' | 'connecting' | 'error'
  const [dataAge, setDataAge] = useState(null);
  const [history, setHistory] = useState([]); // for sparklines (last 20 readings)
  const lastDataTime = useRef(null);

  // Initialize on client only (safe localStorage)
  useEffect(() => {
    const savedUrl = storage.get('droneServerUrl', '');
    setServerUrl(savedUrl);
    setTempUrl(savedUrl);

    const storedLastUsed = storage.get('droneDashLastUsed');
    if (storedLastUsed) {
      setLastUsed(new Date(storedLastUsed).toLocaleString());
    } else {
      setLastUsed('First time usage');
    }
    storage.set('droneDashLastUsed', new Date().toISOString());
  }, []);

  // Poll for latest data
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const base = serverUrl || '';
        const res = await fetch(`${base}/api/latest`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setConnStatus('connected');
          lastDataTime.current = Date.now();
          // Track history for sparklines (keep last 20)
          setHistory(prev => {
            const next = [...prev, json].slice(-20);
            return next;
          });
        } else if (res.status === 404) {
          // Server is up but no data yet
          setConnStatus('connected');
        } else {
          setConnStatus('error');
        }
      } catch {
        setConnStatus('error');
      }
    };

    setConnStatus('connecting');
    fetchLatest();
    const interval = setInterval(fetchLatest, 2000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  // Track data age
  useEffect(() => {
    const tick = setInterval(() => {
      if (lastDataTime.current) {
        const secs = Math.floor((Date.now() - lastDataTime.current) / 1000);
        setDataAge(secs);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const fmt = (num) => (num !== undefined && num !== null ? parseFloat(num).toFixed(2) : '--');
  const isAnomaly = (val) => val === 'Yes' || val === 'True' || val === true;

  const statusLabel = {
    connected: '● Connected',
    connecting: '○ Connecting...',
    error: '✕ Disconnected'
  };
  const statusColor = {
    connected: 'var(--success)',
    connecting: 'var(--text-muted)',
    error: 'var(--danger)'
  };

  const sparkData = (key) => history.map(h => parseFloat(h[key]) || 0);

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          AeroDash
        </div>
        <div className="nav-links">
          <Link href="/" className="active">Real-time</Link>
          <Link href="/history">History</Link>
          <button
            onClick={() => { setTempUrl(serverUrl); setShowSettings(true); }}
            className="settings-btn"
          >
            ⚙️ Settings
          </button>
        </div>
      </nav>

      <div className="container animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Real-time Telemetry</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ color: statusColor[connStatus], fontWeight: 500, fontSize: '0.9rem' }}>
                {statusLabel[connStatus]}
              </span>
              {connStatus === 'connected' && dataAge !== null && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Last data: {dataAge}s ago
                </span>
              )}
              {connStatus === 'error' && (
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                  Cannot reach server. Check IP in Settings.
                </span>
              )}
            </p>
          </div>
          <div className="last-used">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Last session: <span style={{ fontWeight: 600, marginLeft: '4px' }}>{lastUsed}</span>
          </div>
        </div>

        {/* Connection warning banner */}
        {connStatus === 'error' && (
          <div className="alert-banner">
            <strong>⚠ Cannot connect to drone server.</strong>{' '}
            {serverUrl
              ? `Trying: ${serverUrl}. Make sure the server is running and your device is on the same Wi-Fi.`
              : 'Running in local mode. If on Android, tap ⚙️ Settings and enter your PC\'s IP address (e.g. http://192.168.1.5:3000).'}
            <button onClick={() => { setTempUrl(serverUrl); setShowSettings(true); }} className="alert-btn">
              Open Settings →
            </button>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid">
          {/* Time card */}
          <div className="card">
            <h2 className="card-title">📡 Signal & Time</h2>
            <div className="stat-item">
              <span className="stat-label">Date</span>
              <span className="stat-value">{data?.date || '--'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time</span>
              <span className="stat-value">{data?.time || '--'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Connection</span>
              <span className="stat-value" style={{ color: statusColor[connStatus], fontSize: '0.9rem' }}>
                {statusLabel[connStatus]}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Server</span>
              <span className="stat-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {serverUrl || 'localhost:3000'}
              </span>
            </div>
          </div>

          {/* Area coverage */}
          <div className="card">
            <h2 className="card-title">🗺 Area Coverage</h2>
            <div className="stat-item">
              <span className="stat-label">Water Area</span>
              <span className="stat-value" style={{ color: '#3b82f6' }}>{fmt(data?.water_area)} m²</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Path Area</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>{fmt(data?.path_area)} m²</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Vegetation Area</span>
              <span className="stat-value" style={{ color: '#10b981' }}>{fmt(data?.vegetation_area)} m²</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Building / Shed</span>
              <span className="stat-value" style={{ color: '#8b5cf6' }}>{fmt(data?.building_area)} m²</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Dry / Barren Land</span>
              <span className="stat-value" style={{ color: '#ef4444' }}>{fmt(data?.dry_land_area)} m²</span>
            </div>
          </div>

          {/* Anomaly detection */}
          <div className="card">
            <h2 className="card-title">🔍 Anomaly Detection</h2>
            <div className="anomaly-item">
              <div className="anomaly-label">Water Body Abnormality</div>
              <div className={`anomaly-badge ${data ? (isAnomaly(data.water_abnormality) ? 'badge-danger' : 'badge-ok') : 'badge-idle'}`}>
                {data ? (isAnomaly(data.water_abnormality) ? '⚠ DETECTED' : '✓ Normal') : '---'}
              </div>
            </div>
            <div className="anomaly-item" style={{ marginTop: '1.5rem' }}>
              <div className="anomaly-label">Vegetation Abnormality</div>
              <div className={`anomaly-badge ${data ? (isAnomaly(data.vegetation_abnormality) ? 'badge-danger' : 'badge-ok') : 'badge-idle'}`}>
                {data ? (isAnomaly(data.vegetation_abnormality) ? '⚠ DETECTED' : '✓ Normal') : '---'}
              </div>
            </div>
            {data && (isAnomaly(data.water_abnormality) || isAnomaly(data.vegetation_abnormality)) && (
              <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.85rem', color: '#fca5a5' }}>
                ⚠ Anomaly detected in latest scan. Check History for full log.
              </div>
            )}
          </div>
        </div>

        {/* Real-time charts section */}
        <h2 style={{ margin: '2rem 0 1rem', fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          📈 Live Trend Analysis
        </h2>
        <div className="grid grid-4">
          {[
            { key: 'water_area', label: 'Water Area', color: '#3b82f6', unit: 'm²' },
            { key: 'vegetation_area', label: 'Vegetation', color: '#10b981', unit: 'm²' },
            { key: 'path_area', label: 'Path Area', color: '#f59e0b', unit: 'm²' },
            { key: 'dry_land_area', label: 'Dry Land', color: '#ef4444', unit: 'm²' },
          ].map(({ key, label, color, unit }) => {
            const vals = sparkData(key);
            const latest = vals[vals.length - 1];
            const prev = vals[vals.length - 2];
            const trend = prev ? ((latest - prev) / prev * 100).toFixed(1) : null;
            return (
              <div key={key} className="card chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>
                      {latest ? latest.toFixed(1) : '--'}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{unit}</span>
                    </div>
                  </div>
                  {trend !== null && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: parseFloat(trend) >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: parseFloat(trend) >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {parseFloat(trend) >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                  )}
                </div>
                <Sparkline data={vals.length >= 2 ? vals : null} color={color} height={44} />
                {vals.length < 2 && (
                  <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Collecting data...
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Area breakdown bar chart */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title">📊 Area Breakdown (Current Reading)</h2>
          <div style={{ maxWidth: '600px' }}>
            <AreaBarChart data={data} />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="card modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '0.5rem' }}>⚙️ Connection Settings</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
              <strong>On Android:</strong> Enter your PC's local IP address where the server is running.<br />
              Both devices must be on the same Wi-Fi network.<br />
              <strong>On PC:</strong> Leave blank (uses localhost automatically).
            </p>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
              Server URL
            </label>
            <input
              type="text"
              placeholder="http://192.168.1.100:3000"
              value={tempUrl}
              onChange={e => setTempUrl(e.target.value)}
              className="settings-input"
            />
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '0.75rem', marginTop: '1rem', fontSize: '0.82rem', color: '#93c5fd', lineHeight: 1.6 }}>
              <strong>How to find your PC's IP:</strong><br />
              Windows: Run <code>ipconfig</code> → look for IPv4 Address<br />
              Mac/Linux: Run <code>ifconfig</code> or check Wi-Fi settings<br />
              Example: <code>http://192.168.1.100:3000</code>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setShowSettings(false)} className="btn-ghost">Cancel</button>
              <button onClick={() => {
                const clean = tempUrl.replace(/\/$/, '');
                storage.set('droneServerUrl', clean);
                setServerUrl(clean);
                setShowSettings(false);
              }} className="btn">Save & Connect</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .settings-btn {
          background: transparent;
          border: 1px solid var(--primary);
          color: var(--primary);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          margin-left: 1rem;
          font-size: 0.9rem;
          transition: background 0.2s;
        }
        .settings-btn:hover { background: rgba(59,130,246,0.1); }
        .card-title {
          margin-bottom: 1.25rem;
          font-size: 1rem;
          font-weight: 600;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 0.6rem;
        }
        .anomaly-item { }
        .anomaly-label { color: var(--text-muted); font-size: 0.88rem; margin-bottom: 0.5rem; }
        .anomaly-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .badge-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
        .badge-ok { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .badge-idle { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }
        .alert-banner {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
          font-size: 0.88rem;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .alert-btn {
          background: rgba(239,68,68,0.2);
          border: 1px solid rgba(239,68,68,0.4);
          color: #ef4444;
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          white-space: nowrap;
        }
        .grid-4 {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .chart-card { padding: 1.25rem; }
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-box { width: 440px; max-width: 100%; }
        .settings-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.25);
          color: white;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .settings-input:focus { border-color: var(--primary); }
        .btn { background: var(--primary); color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
        .btn:hover { background: var(--primary-hover); }
        .btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--text-muted); padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
        .btn-ghost:hover { background: rgba(255,255,255,0.05); }
      `}</style>
    </>
  );
}
