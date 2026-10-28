# Local PHP prototype

Run `C:\xampp\php\php.exe -S 127.0.0.1:8088 -t C:\xampp\htdocs\ims` and open http://127.0.0.1:8088/. On first visit create the initial super administrator. The first setup screen must only be used on a trusted local machine. Stop the server with Ctrl+C.

Folders: `frontend` contains CSS and JavaScript; `backend` contains CSV exports and demo seeding; `database` contains the local SQLite connection and database; `authentication` contains sign-in and account management; `backups` is reserved for future backup functionality. The root index contains the prototype interface and handlers.

Super administrators can create accounts, activate public registration requests, reset passwords, and delete or restore records. Password reset requests are shown in account management; there is no email delivery. All account permissions and deletion restrictions are experimental. Costs remain visible to every signed-in user. Demo records are fictional.

This remains a local SQLite prototype, not a cPanel-ready deployment. It lacks production hardening, rate limiting, secure reset delivery, backup tools, MySQL/MariaDB support, full role permissions, and a deployment package. The SQLite file and backups must never be exposed by a web server; Apache denial files are provided, but their effectiveness depends on server configuration, and PHP's built-in server ignores them. Use only on localhost and do not enter sensitive data. Plan and test a migration separately from the existing Next.js project.
