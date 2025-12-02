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
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  const isLoggedIn = useMemo(() => Boolean(session?.user), [session]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && !session) {
      setLoading(true);
      axios
        .post(`${API_BASE}/auth/discord/exchange`, { code })
        .then((res) => setSession(res.data))
        .finally(() => setLoading(false));
    }
  }, [session]);

  useEffect(() => {
    if (!session?.tokenData?.access_token) return;

    const fetchGuilds = async () => {
      try {
        const { data } = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bearer ${session.tokenData.access_token}` }
        });

        const manageable = data.filter((g) => (parseInt(g.permissions, 10) & 0x20) === 0x20);
        setGuilds(manageable);
        if (manageable.length > 0 && !selectedGuild) {
          setSelectedGuild(manageable[0].id);
        }
      } catch (error) {
        console.error('Failed to load guilds', error);
      }
    };

    fetchGuilds();
  }, [session, selectedGuild]);

  useEffect(() => {
    if (!selectedGuild) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/guilds/${selectedGuild}/modules`)
      .then((res) => setModules(res.data))
      .finally(() => setLoading(false));
  }, [selectedGuild]);

  const handleToggle = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.patch(`${API_BASE}/guilds/${selectedGuild}/modules/${id}/toggle`);
      setModules((prev) => prev.map((m) => (m.id === id ? data : m)));
    } finally {
      setLoading(false);
    }
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
          {isLoggedIn ? (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{session.user.username}</p>
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
        Activează sau dezactivează modulele de moderare, automod, logging și welcome direct pe serverele pe care
        le administrezi. Panoul este optimizat atât pentru mobil cât și pentru desktop, iar autentificarea se
        face direct prin Discord OAuth2.
      </p>

      {isLoggedIn && (
        <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: '#94a3b8', fontWeight: 700 }}>Selectează server</p>
            <p style={{ margin: 0, color: '#cbd5e1' }}>
              Vedem doar serverele unde ai permisiunea <strong>Manage Server</strong>.
            </p>
          </div>
          <select
            className="primary-btn"
            style={{ minWidth: '220px' }}
            value={selectedGuild}
            onChange={(e) => setSelectedGuild(e.target.value)}
            disabled={guilds.length === 0 || loading}
          >
            <option value="">Alege un server</option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            loading={loading}
            disabled={!selectedGuild}
            onToggle={handleToggle}
          />
        ))}
        {modules.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#cbd5e1' }}>
            <p>
              {isLoggedIn
                ? 'Alege un server cu permisiuni de administrare pentru a gestiona modulele.'
                : 'Autentifică-te cu Discord pentru a vedea serverele administrate.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
