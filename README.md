# Inventory Management System

A local PHP and SQLite prototype for tracking company assets, supplies, and licenses. It is intended for evaluation and workflow testing before a production system is built.

> **Local testing only:** This application is not ready for cPanel or company-sensitive data. It does not yet support MySQL/MariaDB or the security and backup features required for production.

## What is available

- **Assets:** equipment details, assignment and location fields, status, cost, warranty, notes, and activity history.
- **Supplies:** quantities and stock movements by location, reorder levels, suppliers, and unit costs.
- **Licenses and subscriptions:** provider, seats, assignments, cost, billing, renewal, expiry, and document references.
- **Dashboard:** site summaries, asset status, warranty and audit alerts, low stock, renewals, and recent activity.
- **Registers:** search, location filters, date sorting, pagination, CSV exports, and an image export for individual record details.
- **Accounts:** local sign-in, registration requests, administrator account creation and activation, password-reset requests, and soft deletion and restoration by super administrators.

Asset and license activities are currently history notes: they do not automatically change the record's assignment, status, or location. Edit the record to update those fields. Supply movements update the selected location's quantity. License assignments and document references are text fields, not linked records or uploaded files.

## Requirements

- PHP 8.2 with the PDO SQLite extension enabled. XAMPP's PHP 8.2 has been used for local testing.
- A writable `database/` directory for the SQLite file.
- A modern web browser with JavaScript enabled.

Verify your XAMPP PHP installation in PowerShell:

```powershell
C:\xampp\php\php.exe -v
C:\xampp\php\php.exe -m | Select-String pdo_sqlite
```

No MySQL server or phpMyAdmin configuration is needed for the local prototype.

## Run locally with XAMPP PHP

From PowerShell, run:

```powershell
cd C:\xampp\htdocs\ims
C:\xampp\php\php.exe -S 127.0.0.1:8088 -t C:\xampp\htdocs\ims
```

Open [http://127.0.0.1:8088/](http://127.0.0.1:8088/). Keep the terminal open while testing; press **Ctrl+C** to stop the server. If port 8088 is already in use, choose another port in both the command and browser address.

On the first visit, create the initial **super administrator** using the setup form, then sign in. Perform the initial setup only on a trusted local machine. Registration requests remain inactive until a super administrator activates them in **Account management**.

The forgot-password form records a reset request for a super administrator; it does not send email. The administrator sets a new password through Account management.

## Demo data

To add fictional sample records to a fresh local database, run:

```powershell
C:\xampp\php\php.exe backend\seed-demo.php
```

The seed adds 30 assets, 24 supply-location records, and 15 licenses. It does not replace existing records and will not add the same demo set twice. Seed dates are illustrative and are not intended to represent real transactions.

## Exporting data

Select **Export Data** in a register to export all active records or records created within an inclusive date range. CSV files open in Excel; timestamps and date ranges use Philippine time. Date-range exports contain the records' current details, not a historical snapshot. Deleted records are excluded. The separate activity report uses activity dates rather than record creation dates.

## Project layout

```text
index.php          Main prototype interface and request handling
frontend/          CSS and JavaScript
backend/           CSV exports, activity reports, and demo seed
authentication/    Sign-in, registration, and account administration
database/          SQLite connection and local database
backups/           Reserved for future backup functionality
```

The SQLite database is created at `database/prototype.sqlite` and is excluded from Git. It contains local records and account information; back it up before replacing or deleting it. The `backups/` folder is a placeholder, not an automatic backup system.

## Current limitations and deployment

This is an experimental prototype. It does not yet provide production-grade authentication, rate limiting, email-based reset, complete role and cost permissions, import, file uploads, normalized employee/location records, or backup and restore tools. Activity is currently attributed to **Local user**, not individual accounts. Costs are visible to all signed-in users.

SQLite and backup files must not be exposed through a web server. The supplied Apache `.htaccess` files depend on the server configuration, and PHP's built-in server does not enforce them. Bind the local server to `127.0.0.1`, do not expose it to a network, and do not enter sensitive information.

For cPanel, the application needs a deliberate migration to MySQL or MariaDB, secure configuration and file storage, appropriate authentication and authorization, backups, and deployment testing. It is not currently a plug-and-play cPanel release.
