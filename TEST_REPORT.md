# PFSA Phase 3 verification

Executed with Node.js 24.22.1 in Linux.

## Automated checks

`npm test`: **38 passed, 0 failed**.

Coverage includes:

- Vercel hosted API explicitly returns 503 without accepting applicant data; frontend routing configuration verified.
- Exactly six canonical domain IDs and structured learning content.
- Independent server-validated registration in all six domains.
- Required fields, email, consent, reason length, file extension, MIME, content, and 5 MB limits.
- Recognizable DOCX structure accepted; spoofed document rejected.
- Same-domain duplicate rejection without leftover uploads.
- Injected SQLite insertion failure with resume cleanup and no false confirmation.
- Real statistics, domain/status/date filtering, search, pagination, and invalid filter rejection.
- Admin login, incorrect password, session rotation, CSRF/origin checks, unauthenticated access rejection.
- Authenticated application details, resume download, status updates, CSV and filtered CSV.
- CSV quoting, multiline text, and spreadsheet formula protection.
- SQLite record and server-session persistence across server restart.
- Record/resume deletion, retention purge, database initialization, administrator provisioning, and backup recovery data.
- Login/submission rate limits and absolute session expiry.
- React admin flow against the actual Express/SQLite API: login, zero counters, listing, domain/search filters, details, download links, status change, CSV links, logout. The status-save/back-navigation race found during testing was fixed and retested.

`npm run build`: strict frontend/backend TypeScript checks and Vite production build passed.

Production-server smoke check: compiled Express entrypoint served `/` and `/admin`, health returned success, unauthenticated dashboard access returned 401, and the private database URL returned 404.

## Browser checks

- Selected Mobile Forensics from its own card; form inherited the correct domain.
- Filled synthetic fields, selected a synthetic resume, and received a real saved application reference after the backend response.
- Empty-file validation was observed and corrected before completing the test.
- Ctrl+Alt+A opened `/admin` without bypassing login.
- Direct `/admin` navigation/reload showed the protected administrator entry screen.
- Landing-page and registration-modal widths checked at 320, 375, 430, 768, 1024, and 1440px using browser iframe viewports. No horizontal document or modal overflow; the modal scrolled independently.

Browser test data used a separate throwaway directory and is not included in the ZIP. Automated tests likewise create and delete isolated temporary databases.

## Limits

Authenticated administrator interactions were tested in React/API integration tests, not by manually entering a password in the cloud browser. Physical Android, iPhone, Windows, and macOS tests were not executed. File validation is not malware scanning. This is a local server build; no persistent cloud deployment or production security certification is claimed.
