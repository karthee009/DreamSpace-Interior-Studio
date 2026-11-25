# DreamSpace Interior Studio — Full Project

A full-stack starter/MVP for an interior design studio: React + Vite + Three.js/React Three Fiber, Express REST API, MySQL, session authentication, project and room management, photo uploads, catalogue/inventory, editable basic 3D room, estimates, quotations, orders, and reporting.

## Requirements
- Node.js 20+ (LTS recommended)
- MySQL 8+
- npm

## 1. Database
Create a MySQL database and run `database/schema.sql` in MySQL Workbench or:
```sql
SOURCE /absolute/path/to/database/schema.sql;
```

> **Existing database?** If you created the DB before this update, also run `database/migrations/001_add_product_image_url.sql` (adds the missing `products.image_url` column needed for catalogue images).

## 2. Backend
```bash
cd backend
copy .env.example .env
npm install
```
Edit `.env` and set the MySQL credentials and a long random `SESSION_SECRET`.
```bash
npm run dev
```
Backend: `http://localhost:8090`; health: `http://localhost:8090/api/health`.

The first registered account is a normal CUSTOMER. For admin access, register an account and update its role manually in MySQL:
```sql
UPDATE users SET role='ADMIN' WHERE email='your-email@example.com';
```
Do not expose public admin registration.

## 3. Frontend
Open another terminal:
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173`.

## 4. Features in this MVP
- Registration, login/logout, session-backed `/me`, role-aware navigation.
- Public landing page and enquiry submission.
- Project create/list/detail, room measurements, room photo uploads.
- Catalogue list/create (staff roles), stock adjustments (staff roles).
- Basic editable 3D room with dimensions, furniture placement, object selection/removal and POV walkthrough mode.
- Estimate calculation based on catalogue prices and selected furniture.
- Quotation records and PDF download endpoint.
- Orders and basic status updates.
- Summary report endpoint and dashboard.
- Backend unit tests for estimate/quotation totals and the order status flow (`npm test` in `backend`).

## Honest limitations
- The 3D scene uses simple procedural furniture placeholders; it does not automatically reconstruct an accurate 3D room from a photograph.
- AI design generation, production-grade secure customer share links, email delivery, payment processing, real GLB catalogue assets, AR, and complete manufacturing/delivery workflows require separately configured integrations and are not falsely represented as complete.
- This is a locally runnable MVP foundation, not a production security audit. Before deployment, configure HTTPS, secure cookie settings, rate limits, CSRF strategy, backups, storage policy, and operational monitoring.
- Tests are included; run them with `npm test` in the backend and `npm run build` in the frontend. Do not assume they pass until you run them in your environment.

## Environment
Never commit `.env` files or real credentials. See each `.env.example`.
