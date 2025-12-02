# Discord Panel

Panou React + API Express pentru administrarea modulelor unui bot Discord, cu login/register prin OAuth2 și MySQL.

## Cum pornești proiectul

1. Instalează dependențele pentru backend și frontend:

```bash
cd server && npm install
cd ../client && npm install
```

2. Configurează variabilele de mediu în `server/.env`:

```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=parola
DB_NAME=discord_panel
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=yyy
DISCORD_REDIRECT_URI=http://localhost:5173
```

3. Pornește API-ul:

```bash
cd server && npm run dev
```

4. Într-o altă consolă pornește frontend-ul:

```bash
cd client && npm run dev
```

## Endpoints rapide

- `POST /api/auth/discord/exchange` — schimbă codul OAuth2 pe token și salvează utilizatorul.
- `GET /api/modules` — listează modulele existente.
- `POST /api/modules` — adaugă un modul nou.
- `PATCH /api/modules/:id/toggle` — activează/dezactivează modulul.
- `POST /api/module-states` — salvează starea unui modul pentru un utilizator.

## Note

- `server/db.js` creează automat tabelele necesare în MySQL la pornire.
- Frontend-ul este mobile-friendly și folosește Vite + React.
