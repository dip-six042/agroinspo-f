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

`node_modules/`, `dist/`, and local env files are git-ignored.
