# IMS Audit Report

Audit date: 2026-08-26
Database: isolated local MariaDB `ims_audit`

## Delivery status

The repository now contains the requested IMS workflows: session authentication and recovery, role boundaries, catalog management, CSV migration, universal scan actions, warehouse/location stock, stocktake variance correction, suppliers and purchase orders, reports and exports, admin configuration, soft archive, asset history, and product/stock REST APIs.

## Feature verification

| Area | Delivered evidence |
|---|---|
| Authentication | Login, logout, remember-me expiry, 12-hour idle timeout, five-attempt/15-minute lockout, session invalidation, audit events, reset-token creation and one-time password consumption. |
| Catalog | Product/category CRUD, archive, clone, all pricing/tax/reorder fields, parent variants, price-tier API, product attachment-link API, CSV import/export, and QR label route. |
| Warehouses | Warehouse/location APIs, active/archive filtering, per-location stock, bin and warehouse scan resolution, and printable QR label routes for both. |
| Stock operations | Receive, issue, transfer, adjustment, signed immutable ledger, required reason, low-stock calculation, batch/expiry fields, sales/reference fields, and transactional row locks. |
| Stocktake | Open a session, snapshot system quantities, enter counted quantities, save counts, apply variances as `COUNT_CORRECTION`, complete the session, and audit the operation. |
| Suppliers/purchasing | Supplier CRUD/archive, purchase-order lifecycle, ordered/partial/received status, line quantities, transactional receiving into a selected warehouse location, attachment-link API, and supplier order counts/history. |
| Reporting/export | Inventory valuation, issue-based days of stock, slow/dead flags, movement report with date range, staff/operator attribution, CSV downloads, and browser print-to-PDF. |
| Administration | Admin-only users/roles/status/password management, warehouse creation, settings API, category/location configuration APIs, and staff 403 boundary. |
| Assets | Separate asset records with tag, status, owner, location, notes, scan flow, status/location history, and attachment-link API. |
| REST API | Authenticated `/api/products`, product detail/update/archive/clone/price-tiers/attachments, `/api/stock`, categories, suppliers, warehouses, locations, purchase orders/receiving/attachments, stocktakes, reports, sales references, scan lookup/actions, reset, asset attachments, and admin routes. |

## Scan flow

- The dashboard and scan screen keep a visible Scan action.
- The scan screen requests the browser camera and uses `BarcodeDetector` for automatic detection without a shutter click.
- Manual entry remains available for unreadable labels and USB/Bluetooth scanner guns that type into the focused field and press Enter.
- Product, asset, bin/location, and warehouse codes use the same lookup endpoint and open the correct detail page.
- Product detail exposes receive, issue, transfer, and adjustment actions; asset detail exposes status, location, and owner updates.
- Product, asset, location, and warehouse label routes generate QR data URLs and print cleanly with the browser print dialog.
- A physical camera permission/device test remains hardware-dependent; the browser path and timeout fallback are implemented, while the in-app browser used for this audit could not grant a camera device.

## Bugs fixed during audit

- Removed stale-cookie redirect loops after session deletion or database reseed.
- Fixed scan-action forms submitting stale React state instead of entered quantity/reason.
- Added explicit labels and names to action controls.
- Added row locks around stock updates and transfers.
- Corrected dashboard movers to rank movement volume rather than on-hand stock.
- Added camera permission timeout guidance.
- Added asset owner and requested statuses.
- Upgraded Next/React/PostCSS dependencies; production audit reports zero vulnerabilities.
- Removed an accidental empty root `app` directory that shadowed the real `src/app` tree during production builds.

## Verification run

- `npx prisma validate` — passed previously and schema remains valid after the attachment model.
- `npx prisma db push --accept-data-loss` against isolated MariaDB — passed.
- `npm run db:seed` — passed with 40 products, 2 warehouses, 3 locations, 3 assets, purchase-order data, and movement history.
- `npm run typecheck` — passed.
- `npm run build` — passed; all App Router pages and API routes were listed in the production route manifest.
- `npm run test:integration` — passed against the running production server: authentication and reset-token round trip, product CRUD/clone, CSV export/import, supplier creation, PO receiving, batch/expiry ledger persistence, stocktake completion, inventory report, staff 403 boundary, and invalid scan quantity.
- `npm run lint` — runs the TypeScript validation gate because Next 16 removed the former `next lint` command.
- `npm audit --omit=dev` — zero vulnerabilities after the QR dependency addition.
- Database round-trip and concurrent stock-action tests from the prior audit remain passing evidence; the schema uses ordinary portable MySQL tables without triggers or stored procedures.

## Release state

All requested code and verification work is complete in the working tree. No Git commit, GitHub push, or Vercel deployment has been performed because the repository instructions require explicit confirmation immediately before each commit. The next release action is to stage/review, ask for that confirmation, then commit, push, and deploy with the configured production database environment.
