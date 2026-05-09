import React, { useEffect, useState } from 'react';

/**
 * Debug page — shows system status, auth state, and API connectivity.
 * Visit: http://localhost:5175/debug
 */
const DebugPage: React.FC = () => {
  const [apiHealth, setApiHealth] = useState<string>('checking...');
  const [authMe, setAuthMe] = useState<string>('checking...');
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setToken(localStorage.getItem('token'));

    // Test API health
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setApiHealth('✅ ' + JSON.stringify(d)))
      .catch(e => setApiHealth('❌ ' + e.message));

    // Test /auth/me if token exists
    const tok = localStorage.getItem('token');
    if (tok) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.json())
        .then(d => setAuthMe('✅ ' + JSON.stringify(d).substring(0, 200)))
        .catch(e => setAuthMe('❌ ' + e.message));
    } else {
      setAuthMe('⚠️ No token in localStorage');
    }

    // Listen for global JS errors
    const handler = (e: ErrorEvent) => {
      setErrors(prev => [...prev, `${e.message} at ${e.filename}:${e.lineno}`]);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  const row = (label: string, val: React.ReactNode) => (
    <tr key={label}>
      <td style={{ padding: '8px 16px 8px 0', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>{val}</td>
    </tr>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 40, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1F7A63', marginBottom: 8 }}>ACETEL IAMS — System Diagnostics</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>This page shows the current auth and API status to diagnose login issues.</p>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 16 }}>System Status</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {row('API Health', apiHealth)}
            {row('Token in Storage', token ? `✅ ${token.substring(0, 30)}...` : '❌ None')}
            {row('/auth/me Response', authMe)}
            {row('Current URL', window.location.href)}
            {row('React Version', React.version)}
          </tbody>
        </table>
      </div>

      {errors.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', marginBottom: 12 }}>⚠️ JavaScript Errors Detected</h2>
          {errors.map((e, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: '#dc2626', marginBottom: 4 }}>{e}</div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/" style={{ padding: '8px 16px', background: '#1F7A63', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>→ Landing Page</a>
          <a href="/acetel-dashboard" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>→ Dashboard</a>
          <button
            onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}
            style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          >
            🗑️ Clear Token & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
