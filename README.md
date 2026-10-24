# Pramman Forensics Science Academy — Phase 3

A complete local internship-registration and application-management system. The original PFSA React landing page, navy/cyan branding, supplied academy logo, six domains, responsive layouts, and animations are preserved. Students apply without accounts. Only the administrator signs in.

## Requirements

- Node.js **24.13 or newer in the Node 24 LTS line** and npm. This version provides the built-in `node:sqlite` database access module, so no separate SQLite installation or native database package compilation is needed.
- A local computer with a writable project directory. Windows, macOS, and Linux setup commands are included below. Physical-device/OS-specific tests have not been performed.
- No cloud account, database service, external authentication provider, or storage service is required. Google Fonts is optional: system fonts are used if it is unavailable.

## First-time setup

1. Extract the ZIP, open the `PFSA_Phase_3` directory in a terminal, and run:

   ```sh
   npm ci
   ```

2. Create your private environment file.

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:

   ```sh
   cp .env.example .env
   ```

3. Open `.env` in your editor. Generate a session secret with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Paste that generated value into `SESSION_SECRET`. Set `PRIVACY_CONTACT_EMAIL` to a real, monitored academy address. Set `ADMIN_USERNAME` to your chosen username and `ADMIN_PASSWORD` to a unique password of **14–72 characters and no more than 72 UTF-8 bytes**. The setup refuses an empty secret or privacy address. There are no default administrator credentials.

   Keep `HOST=127.0.0.1` and `COOKIE_SECURE=false` for normal local HTTP use. Leave the default origins unchanged unless you change the local ports or hosts. `DATA_DIR` and `UPLOADS_DIR` may be absolute or project-relative paths and must be separate private directories. Do not place either inside `src`, `public`, or `dist`.

4. Initialize the real empty database and provision the administrator:

   ```sh
   npm run db:init
   npm run admin:setup
   ```

   Passwords are bcrypt-hashed with cost 12. No applicants are seeded. Remove `ADMIN_PASSWORD` from `.env` after provisioning; the hash is already stored in SQLite. Keep `SESSION_SECRET` stable across restarts. Never put secrets in `VITE_*` variables, commit `.env`, or share your data directory.

5. Start both processes:

   ```sh
   npm run dev
   ```

   Open **http://127.0.0.1:5173**. The backend runs at **http://127.0.0.1:3001**. Vite proxies `/api` to the backend. The terminal must stay open. Press Ctrl+C to stop both processes.

6. Press **Ctrl+Alt+A** while the website has keyboard focus to open the admin login. The direct fallback is **http://127.0.0.1:5173/admin**. Sign in with the administrator you provisioned. The shortcut cannot bypass authentication; there are no public admin links or admin signup.

## Run the production build locally

```sh
npm run build
npm start
```

Open **http://127.0.0.1:3001** or **http://127.0.0.1:3001/admin**. Express serves the built frontend and API from the same origin. This is a local persistent server, not a deployment to the earlier static preview. The downloadable project does not alter that earlier hosted Phase 2 preview.

For separate development terminals, use `npm run dev:backend` and `npm run dev:frontend`. Dependency installation is `npm ci`; schema initialization is `npm run db:init`; frontend/backend compilation is `npm run build`.

## Public registration

Each of the six Register Now buttons opens the same accessible modal with its own automatically inherited domain. There is no domain dropdown. Stable domain IDs are defined centrally in `shared/domains.ts` and validated independently by the API.

Required fields: full name, email, current stream, institution, resume, reason (20–3,000 characters), and privacy consent. Resumes accept PDF/DOC/DOCX up to 5 MB. The UI shows the selected filename and size and supports removal/replacement. The server checks extension, declared MIME, file signatures, and Word archive structure where applicable, then writes a random private filename and inserts the SQLite record. Only a successful insertion returns a confirmation and reference.

One email may apply once per domain. The same normalized email may apply independently to other domains. A duplicate receives a clear 409 error; existing records are never overwritten. Repeated clicks are blocked while submission is pending. If the connection is lost after a successful insertion, a retry can receive the duplicate error; the administrator can locate the original application by email.

## Private administrator workspace

- Seven real summary counts: total plus all six domains; empty databases show zero.
- Clickable domain distribution chart, date filtering, and recent applications.
- Domain/status filters, name/email/institution search, ascending/descending registration dates, server pagination (20 per page).
- Application details, private resume downloads, status changes, and verified privacy-request deletion.
- Statuses: New, Under Review, Shortlisted, Rejected.
- All, domain-specific, and currently filtered CSV downloads. Pagination does not limit exports. A 50,000-record cap produces an explicit request to narrow filters.
- CSV includes all requested applicant fields, resume filenames/identifiers, status, dates, and consent time. It escapes quotes, line breaks, and commas and prefixes spreadsheet-formula cells safely. It does not include file paths, password hashes, sessions, or file contents.
- Logout revokes the server-side session. Password reset/reprovisioning revokes all existing sessions.

## Security and data handling

- Parameterized SQL, foreign-key domain validation, schema constraints and indexes.
- Server-side Zod validation, bounded request/file sizes and multipart parts.
- Randomized resume filenames; original filenames never become filesystem paths.
- Files are outside web-public directories; Vite also denies private directories and database files during development.
- Every private API route requires an authenticated server-side session. Resume downloads are authenticated attachments with `nosniff` headers.
- Bcrypt password hashing, HttpOnly/SameSite=Strict cookies, absolute session lifetime, CSRF tokens and origin checks, session rotation on login, and request rate limits.
- Cookies become Secure when `COOKIE_SECURE=true`; use this only with HTTPS. No reverse-proxy trust is enabled by default. A future HTTPS proxy deployment needs an explicitly reviewed proxy configuration.
- Login limit: 10 attempts/IP/15 minutes. Submission limit: 12 attempts/IP/15 minutes. Rate counters are in process memory and reset after a restart; this is suitable for this local single-server scope, not distributed deployment.
- Safe errors; no applicant/resume contents are logged. Private API responses are `no-store`. No browser localStorage, analytics, cloud database, or external file storage is used.
- Document validation is type/signature/structure validation, **not an antivirus scan**. Do not open untrusted resumes in an unpatched document viewer. Stronger document scanning can be added before public production exposure.
- Database/files are protected by OS permissions where supported; they are not application-encrypted at rest. Protect the computer/account and use disk encryption as appropriate. Windows users should restrict the project/data directories with NTFS permissions.

## Privacy, deletion, and retention

The form displays the configured academy contact, collection purpose, administrator-only access, and retention policy before consent. Default active-record retention is 180 days; change `RETENTION_DAYS` if your policy differs. Expired records and their resume files are removed at startup and hourly while the backend runs. A stopped local server cannot perform maintenance until restarted. Run `npm run data:purge` manually when needed.

Applicants request access/correction/deletion by emailing the configured address with their application reference and application email. The academy must verify the requester. The administrator can then use Delete application and resume in the details view; active deletion is permanent. For corrections beyond review status, use a controlled operator process or delete and invite a new application rather than editing the database casually.

Backups in `DATA_DIR/backups` are removed after seven days at startup/hourly maintenance or when creating another backup. Therefore deleted data may remain in these backups for up to seven additional days while maintenance runs. The operator must protect and expire any copied/offline backups, and must not restore deleted/expired applicant records without reapplying deletion/retention requests. A computer that remains off will retain files until maintenance resumes.

## Backups and recovery

Stop **all frontend and backend processes** first for a consistent snapshot, then run:

```sh
npm run data:backup
```

This uses SQLite's backup API and copies the corresponding private resume files to a timestamped directory inside `DATA_DIR/backups`. It contains sensitive data: do not commit, email, or publish it. Backup consistency requires a stopped application; the command is not an online distributed snapshot coordinator.

To restore: stop the server; make a safety copy of current data; copy the chosen `pfsa.sqlite` to `DATA_DIR/pfsa.sqlite` and its `uploads` contents to `UPLOADS_DIR`; remove old SQLite `-wal` and `-shm` sidecars **only while the server is stopped**. Provision/reset the administrator with `npm run admin:setup` to revoke restored sessions. Restart and verify counts and downloads. Reapply any deletion requests newer than the backup. Do not merge a backup with unrelated live files.

## Reset the administrator

Stop the server, temporarily set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`, run `npm run admin:setup`, then remove `ADMIN_PASSWORD` again. This overwrites the single administrator's hash and deletes all server sessions. There is no public password-reset endpoint.

## Project structure

```text
src/                         Existing React + TypeScript frontend
  components/                Public landing-page sections and modals
    admin/                   Lazy-loaded private workspace
  config/                    Brand/navigation settings
  data/                      Domain learning content and FAQs
  services/                  API client and client validation
  types/                     Frontend interfaces
shared/domains.ts            Canonical six IDs and review statuses
backend/                     Express API, sessions, SQLite, uploads, CLI
scripts/dev.mjs              Cross-platform local process runner
tests/                       API, validation, React integration tests
public/pramaan-forensic-logo.jpg  Academy-supplied Pramaan Forensic artwork
.env.example                 Blank configuration template
```

`data/`, `uploads/`, `.env`, dependencies, compiled output, and database files are excluded from source control. The delivered ZIP contains source, tests, lockfile, environment example, and documentation; it has no configured administrator, database, uploaded resumes, or test applicant records. The initial real database is created by setup.

## API

Public: `GET /api/health`, `GET /api/public/config`, `POST /api/applications` (multipart with CSRF token from public config).

Admin: `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`, `GET /api/admin/dashboard`, `GET /api/admin/applications`, `GET /api/admin/applications/:id`, `PATCH /api/admin/applications/:id/status`, `DELETE /api/admin/applications/:id`, `GET /api/admin/applications/:id/resume`, `GET /api/admin/export/csv`.

List/export filters: `search`, `domainId`, `status`, `from`, `to`, `sort`; lists additionally use `page`, `pageSize`. Date filters use UTC calendar days; rendered timestamps use the administrator browser's locale/timezone. Invalid parameters return 400; unauthenticated private requests return 401. All mutation routes require the session-bound `X-CSRF-Token`. There is no CORS wildcard.

## Verification

Run:

```sh
npm test
npm run build
```

Tests create and remove isolated temporary databases. They never seed your real data directory. The suite covers all six domain submissions, required fields, MIME/content/size rejection, duplicates, insertion-failure file cleanup, persistence across restart, authentication/CSRF, statistics, filters/search/pagination, details/downloads/status changes, CSV exports and formula escaping, retention/deletion, client validation, and the React admin flow against an actual test API. Test fixtures are synthetic.

Browser QA separately exercised a real synthetic registration with resume selection, database-backed confirmation/reference, Ctrl+Alt+A, and direct protected `/admin` navigation. An authenticated admin login was exercised through the automated React/API integration test. It was not manually signed into in the cloud browser. Physical Android/iPhone testing is not claimed.

## Hosting boundary

Keep this phase local. A static/serverless frontend host cannot persist this SQLite file or local resume directory automatically. Future public hosting needs a persistent backend process, durable private disk, HTTPS, backup operations, and a reviewed security/privacy configuration. This project does not migrate to a cloud service or deploy applicant data.

## Academy logo

The supplied black-and-white Pramaan Forensic logo is used in the public header/footer, administrator login/sidebar, and browser icon. The original artwork is preserved, without cropping or recoloring, on a white tile for contrast with the navy interface. `AcademyLogo` centralizes its rendering.
