# GS01 Frontend

React 18 + Vite + TypeScript frontend for Cloudflare Pages.

## Environment

Create `app/frontend/.env.local` for local development:

```bash
VITE_API_URL=http://localhost:3000
```

For Cloudflare Pages, set `VITE_API_URL` to `https://api-rm562192.<zone>`.

## Scripts

```bash
npm install
npm run dev
npm run build
```

Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `app/frontend`
- Node version: `20`
