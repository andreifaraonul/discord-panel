import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ModuleCard from './components/ModuleCard.jsx';

const API_BASE = '/api';

const discordAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID || '',
    redirect_uri: import.meta.env.VITE_DISCORD_REDIRECT_URI || 'http://localhost:5173/login',
    response_type: 'code',
    scope: 'identify email guilds'
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
};

export default function App() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const isLoggedIn = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    axios.get(`${API_BASE}/modules`).then((res) => setModules(res.data));
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && !user) {
      setLoading(true);
      axios
        .post(`${API_BASE}/auth/discord/exchange`, { code })
        .then((res) => setUser(res.data.user))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleToggle = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.patch(`${API_BASE}/modules/${id}/toggle`);
      setModules((prev) => prev.map((m) => (m.id === id ? data : m)));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const name = prompt('Module name');
    if (!name) return;
    const description = prompt('Short description') || '';
    const { data } = await axios.post(`${API_BASE}/modules`, { name, description });
    setModules(data);
  };

  return (
    <div className="app-shell">
      <div className="header">
        <div className="title-area">
          <div className="logo">DP</div>
          <div>
            <p style={{ margin: 0, color: '#a5b4fc', fontWeight: 700 }}>Discord Panel</p>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>
              Controlează modulele botului tău
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="primary-btn" onClick={handleAdd} disabled={!isLoggedIn || loading}>
            + Adaugă modul
          </button>
          {isLoggedIn ? (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{user.username}</p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Conectat cu Discord</p>
            </div>
          ) : (
            <a className="primary-btn" href={discordAuthUrl()}>
              Login / Register cu Discord
            </a>
          )}
        </div>
      </div>

      <p style={{ color: '#cbd5e1', marginTop: 12, lineHeight: 1.5 }}>
        Activează, dezactivează sau adaugă module noi pentru bot. Panoul este optimizat atât pentru mobil cât
        și pentru desktop, iar autentificarea se face direct prin Discord OAuth2.
      </p>

      <div className="grid">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} loading={loading} onToggle={handleToggle} />
        ))}
        {modules.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#cbd5e1' }}>
            <p>Nu există module încă. Începe prin a adăuga unul!</p>
          </div>
        )}
      </div>
    </div>
  );
}
