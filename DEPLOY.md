# Free demo deployment

Stack: **TiDB Cloud Starter** (MySQL-compatible DB) + **Render** (backend) + **Vercel** (frontend).
Vercel proxies `/api` and `/uploads` to Render, so the browser only talks to one domain and login cookies just work.

## 1. Database (TiDB Cloud Starter, free, no card)
1. Sign up at tidbcloud.com -> create a **Starter** instance (MySQL-compatible).
2. Click **Connect** -> note Host, Port (4000), User (looks like `xxxx.root`), Password.
3. Open **SQL Editor**, paste all of `database/schema.sql`, run it.
4. Register an account on the live site later, then run:
   `UPDATE dreamspace_db.users SET role='ADMIN' WHERE email='you@example.com';`

## 2. Backend (Render, free)
1. Push this project to GitHub (never commit `.env`).
2. Render -> New -> **Blueprint** -> pick the repo (uses `render.yaml`).
3. Fill: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=dreamspace_db`, and `FRONTEND_ORIGIN` (your Vercel URL; put a placeholder first, update after step 3).
4. After deploy, open `https://<name>.onrender.com/api/health` -> should show `database: connected`.

## 3. Frontend (Vercel, free)
1. In `frontend/vercel.json` replace both `YOUR-RENDER-APP.onrender.com` with your Render host. Commit + push.
2. Vercel -> Add New Project -> same repo -> **Root Directory: `frontend`** (Vite is auto-detected).
3. Deploy. Copy the Vercel URL into Render's `FRONTEND_ORIGIN`.

## Demo-day notes
- Render free spins down after 15 min idle; first request takes ~1 min. Open `/api/health` 2 minutes before the demo.
- Render's disk is ephemeral: uploaded catalogue/room images disappear on restart or redeploy. Upload images right before the demo and don't redeploy after.
- TiDB free quota: 5 GiB storage, 50M request units/month - plenty for a demo.
