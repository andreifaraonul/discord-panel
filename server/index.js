import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getPool, initSchema } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5173/login';

initSchema().catch((err) => console.error('DB init error', err));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/discord/exchange', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: DISCORD_REDIRECT_URI
  });

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ error: 'Discord token exchange failed' });
    }

    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const user = await userRes.json();
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [user.id]);

    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO users (discord_id, username, avatar, access_token, refresh_token) VALUES (?, ?, ?, ?, ?)',
        [user.id, `${user.username}#${user.discriminator}`, user.avatar, tokenData.access_token, tokenData.refresh_token]
      );
    } else {
      await pool.query(
        'UPDATE users SET username = ?, avatar = ?, access_token = ?, refresh_token = ? WHERE discord_id = ?',
        [`${user.username}#${user.discriminator}`, user.avatar, tokenData.access_token, tokenData.refresh_token, user.id]
      );
    }

    res.json({ user, tokenData });
  } catch (error) {
    console.error('Discord auth failed', error);
    res.status(500).json({ error: 'Discord auth failed' });
  }
});

app.get('/api/modules', async (_req, res) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM modules ORDER BY name ASC');
  res.json(rows);
});

app.post('/api/modules', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const pool = getPool();
  await pool.query('INSERT INTO modules (name, description) VALUES (?, ?)', [name, description || '']);
  const [rows] = await pool.query('SELECT * FROM modules ORDER BY name ASC');
  res.json(rows);
});

app.patch('/api/modules/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const pool = getPool();
  const [modules] = await pool.query('SELECT * FROM modules WHERE id = ?', [id]);
  if (modules.length === 0) return res.status(404).json({ error: 'Module not found' });
  const current = modules[0];
  await pool.query('UPDATE modules SET enabled = ? WHERE id = ?', [!current.enabled, id]);
  const [updated] = await pool.query('SELECT * FROM modules WHERE id = ?', [id]);
  res.json(updated[0]);
});

app.post('/api/module-states', async (req, res) => {
  const { userId, moduleId, enabled } = req.body;
  const pool = getPool();
  await pool.query(
    'REPLACE INTO module_states (user_id, module_id, enabled) VALUES (?, ?, ?)',
    [userId, moduleId, enabled !== false]
  );
  res.json({ success: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API server ready on port ${port}`));
