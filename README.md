# Agro Inspo frontend

React + Vite + Tailwind site for Agro Inspo: the public pages, sign-in, and the member portals.

The API lives in a separate repo: [agroinspo-b](https://github.com/dip-six042/agroinspo-b).

## Run locally

Node.js 22 or newer.

```bash
npm install
npm run dev
```

The site runs at http://localhost:3000. Requests to `/api` are proxied to the API at http://localhost:8787, so start the backend first.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serves the production build |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |

`node_modules/`, `dist/`, and local env files are git-ignored. `.env.production` is committed because it only names the public API host.

## Host on Vercel

Import this repo in Vercel. Framework preset: Vite. No extra environment variables are required.

`vercel.json` proxies `/api` to `https://agroinspo-b.onrender.com`, so the browser stays on the Vercel domain and login cookies keep working. If Render gives the API a different hostname, change that destination and `VITE_API_ORIGIN` in `.env.production` together. The live site is expected at https://agroinspo-f.vercel.app. If Vercel assigns another URL, set the backend `APP_URL` and `ALLOWED_ORIGINS` to that exact origin.
