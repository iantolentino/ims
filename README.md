# Inventory Management System

The PHP/SQLite local system is at the repository root. See [PHP-README.md](PHP-README.md) for local setup and limitations. The existing Next.js application is retained below pending a migration decision.

# Stockroom / Inventory Management System

Stockroom is a dense, warehouse-oriented inventory workspace built with Next.js App Router, TypeScript, Prisma, and MySQL.

## Local setup

1. Install Node.js 20+ and MySQL 8+.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` plus a long `SESSION_SECRET`.
3. Install dependencies: `npm install`.
4. Create the schema: `npm run db:push`.
5. Load the demo workspace: `npm run db:seed`.
6. Start the app: `npm run dev` and open `http://localhost:3000`.

Demo accounts:

- Admin: `admin@stockroom.test` / `Admin123!`
- Staff: `operator` / `Staff123!`

## Deploy to Vercel

Import the repository as a standard Next.js project. Add `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_PUBLIC_APP_NAME` to the Vercel project environment. Run the schema against the managed MySQL database before opening the app, then run `npm run db:seed` once if demo data is desired.

## phpMyAdmin migration

The schema uses ordinary MySQL tables, columns, foreign keys, indexes, and decimal values. No stored procedures, triggers, or vendor-specific runtime logic are required.

1. In phpMyAdmin, select the IMS database and choose **Export → Custom → SQL**, including structure and data.
2. On the new MySQL instance, create an empty database with the same character set (usually `utf8mb4`), then use **Import** to upload the SQL dump.
3. Update only `DATABASE_URL` in the app environment and restart the Next.js process. The application schema and app code do not change.
4. Verify sign-in and the dashboard, then remove any temporary dump files from public hosting storage.

For a clean schema-only refresh in development, use `npm run db:push`; use `prisma migrate` for tracked development migrations. Always take a phpMyAdmin export before changing a production database.

## Moving from Vercel to cPanel / Node hosting

Build with `npm run build`, run the app with `npm start`, and point the hosting environment at the same MySQL database. Set the same environment variables and use a process manager or the host's Node application runner. Static assets remain in the Next.js build; no schema or application logic changes are needed.

## Current delivery slice

Phase 1 includes the normalized schema foundation, custom session auth, bcrypt password hashing, remember-me sessions, failed-login lockout, audit entries for authentication, reset-token console logging, seed data, and the first dashboard read view. The universal Scan flow is also available from the dashboard: it uses the browser camera with automatic `BarcodeDetector` lookup where supported, accepts manual/USB scanner input as fallback, resolves products, bins, warehouses, and physical assets, and exposes in-context stock or asset updates. Catalog CRUD, purchasing workflows, reporting exports, and admin screens remain next phases.
