import { useEffect, useState } from 'react';
import Link from 'next/link';

const storage = {
  get: (key, fallback = '') => {
    if (typeof window === 'undefined') return fallback;
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }
};

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setServerUrl(storage.get('droneServerUrl', ''));
  }, []);

  const fetchHistory = async (base = serverUrl) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/api/data`);
      if (res.ok) {
        setHistory(await res.json());
      } else {
        setError(`Server returned ${res.status}`);
      }
    } catch {
      setError('Cannot reach server. Check your connection settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [serverUrl]);

  const handleExport = () => {
    window.open(`${serverUrl || ''}/api/export`, '_blank');
  };

  const handleReset = async () => {
    if (!confirm('Delete ALL drone records permanently? This cannot be undone.')) return;
    setResetting(true);
    try {
      const res = await fetch(`${serverUrl || ''}/api/reset`, { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      } else {
        alert('Reset failed. Try again.');
      }
    } catch {
      alert('Cannot reach server.');
    } finally {
      setResetting(false);
    }
  };

  const fmt = (num) => (num !== undefined && num !== null ? parseFloat(num).toFixed(2) : '--');
  const isAnomaly = (val) => val === 'Yes' || val === 'True' || val === true;

  const filtered = searchDate
    ? history.filter(row => row.date?.includes(searchDate))
    : history;

  const anomalyCount = history.filter(r => isAnomaly(r.water_abnormality) || isAnomaly(r.vegetation_abnormality)).length;
  const avgWater = history.length ? (history.reduce((s, r) => s + (parseFloat(r.water_area) || 0), 0) / history.length).toFixed(1) : '--';
  const avgVeg = history.length ? (history.reduce((s, r) => s + (parseFloat(r.vegetation_area) || 0), 0) / history.length).toFixed(1) : '--';

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          AeroDash
        </div>
        <div className="nav-links">
          <Link href="/">Real-time</Link>
          <Link href="/history" className="active">History</Link>
        </div>
      </nav>

      <div className="container animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Historical Data Logs</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{history.length} total records</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleExport} className="btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Excel
            </button>
            <button onClick={handleReset} className="btn btn-danger" disabled={resetting || history.length === 0}>
              {resetting ? 'Resetting...' : '🗑 Reset Data'}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid" style={{ marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Total Records</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{history.length}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Anomalies Detected</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: anomalyCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{anomalyCount}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Avg Water Area</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{avgWater} <span style={{ fontSize: '1rem' }}>m²</span></div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Avg Vegetation</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{avgVeg} <span style={{ fontSize: '1rem' }}>m²</span></div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter by date (e.g. 2026-05)"
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.9rem', outline: 'none', width: '240px' }}
          />
          {searchDate && (
            <button onClick={() => setSearchDate('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕ Clear</button>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>
            Showing {filtered.length} of {history.length}
          </span>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          {error && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--danger)', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', marginBottom: '1rem' }}>
              ⚠ {error}
            </div>
          )}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Time</th>
                  <th>Water (m²)</th><th>Path (m²)</th><th>Veg. (m²)</th>
                  <th>Building (m²)</th><th>Dry Land (m²)</th>
                  <th>Water Anom.</th><th>Veg. Anom.</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>Loading records...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {history.length === 0 ? 'No records yet. Start your drone or run the mock simulator.' : 'No records match your filter.'}
                  </td></tr>
                ) : (
                  filtered.map(row => (
                    <tr key={row.id} style={{ background: (isAnomaly(row.water_abnormality) || isAnomaly(row.vegetation_abnormality)) ? 'rgba(239,68,68,0.04)' : '' }}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.id}</td>
                      <td>{row.date}</td><td>{row.time}</td>
                      <td>{fmt(row.water_area)}</td><td>{fmt(row.path_area)}</td>
                      <td>{fmt(row.vegetation_area)}</td><td>{fmt(row.building_area)}</td>
                      <td>{fmt(row.dry_land_area)}</td>
                      <td className={isAnomaly(row.water_abnormality) ? 'abnormal' : 'normal'}>
                        {isAnomaly(row.water_abnormality) ? '⚠ Yes' : '✓ No'}
                      </td>
                      <td className={isAnomaly(row.vegetation_abnormality) ? 'abnormal' : 'normal'}>
                        {isAnomaly(row.vegetation_abnormality) ? '⚠ Yes' : '✓ No'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn { background: var(--primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.4rem; }
        .btn:hover { background: var(--primary-hover); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
        .btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
      `}</style>
    </>
  );
}
