# Changelog

All notable changes to SFXProOne CaseManager are documented here.

---

## v1.0.2 - 2026-03-31

### Added

- Inventory search: live client-side filter input on the Inventory page that searches by case name and item names within a case; cases matched via item show the matching item names highlighted below the case metadata
- iPhone safe-area support: header now extends under the notch/Dynamic Island (`env(safe-area-inset-top)`), footer has padding above the home indicator (`env(safe-area-inset-bottom)`)
- Inventory search: matched item names now wrap across multiple lines instead of overflowing as a single truncated line; each item on its own line
- Search input clear button styled as a custom white SVG X, replacing the native browser icon which was not visible on the dark background
- New case creation now completes in one step: "Create Case" creates the case, uploads any pending photos and documents, then redirects to the case detail page - no second "Save Changes" click required
- PDF upload now shows an inline title and type form instead of browser prompt dialogs; document type is a dropdown (Manual / Certificate / Other)
- Document type enum values renamed from ALL_CAPS to CamelCase; added Bill, Order, Invoice, and Service Report types
- Edit Case button added to the case detail view for editors and admins, linking directly to the case editor
- Audit logging for all write operations - events are stored in a new `AuditLog` table and displayed in the Admin panel (last 100 events, most recent first)
- Logged events: `CASE_CREATED`, `CASE_UPDATED`, `CASE_DELETED`, `IMAGE_UPLOADED`, `IMAGE_DELETED`, `DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`, `ITEM_MOVED`, `ROLE_CHANGED`
- Each log entry records the acting user, target resource ID, and a JSON metadata field (e.g. case name, file name, old/new role)
- New user account: `editor@sfxproone.com` with Editor role

### Changed

- Added Events tab to the header navigation (visible to all roles, placeholder for now)
- Moved Admin link from the header to the footer alongside Release notes; only visible to admins
- Renamed the "Editor" navigation tab to "Inventory"
- Inventory page is now accessible to users with the Viewer role
- Viewers see the full case list with "View" links but no write controls (New Case, Edit, Delete buttons are hidden)

### Infrastructure

- Added `docker-compose.override.yml` for local deployment (local volumes, exposed ports 3000/9000/9001, local proxy network)
- Updated `.env` with local-deployment defaults (`NEXTAUTH_URL`, `MINIO_PUBLIC_URL` pointing to localhost, generated `AUTH_SECRET`)
- Added migration `20260331000000_add_audit_log` creating the `AuditLog` table with a descending `createdAt` index

---

## v1.0.1 - 2026-03-26

### Added

- QR code generator modal in the editor: enter a custom label or auto-generate a 20-character random ID, renders a downloadable 1024×1024 PNG with a text label strip
- Footer on every page with credits ("Made by olliecross © 2026"), social icon links (Instagram, LinkedIn, GitHub), and a link to the release notes

### Fixed

- File uploads in production were blocked by a Mixed Content error -presigned PUT URLs were signed against the internal Docker hostname (`http://minio:9000`). Introduced a separate `s3Public` client using `MINIO_PUBLIC_URL` so the browser receives a valid public HTTPS URL
- File uploads returned 403 Forbidden -AWS SDK v3 was adding a `x-amz-checksum-crc32` header to presigned URLs which MinIO rejected. Fixed by setting `requestChecksumCalculation: 'WHEN_REQUIRED'`
- File uploads returned 403 Forbidden -`PutObjectCommand` included a `ContentLength` of 20 MB, causing a signature mismatch when the actual file was smaller. Removed `ContentLength` from the command
- Uploaded files could not be viewed -presigned GET URLs were also signed against the internal hostname. `getFileUrl()` now uses `s3Public`
- PDF.js worker returned 404 -the CDN URL for pdfjs-dist 4.10.38 does not exist on cdnjs. Worker file is now self-hosted at `/pdf.worker.min.mjs` (copied from `node_modules`)
- PDF viewer only showed content after pressing "Next" -`renderPage(1)` ran before React had mounted the canvas element. Canvas is now always in the DOM (hidden via CSS while loading) so the ref is available immediately
- CORS errors on MinIO PUT requests -`PutBucketCorsCommand` is not implemented in this MinIO build. Removed the SDK call and configured CORS via Traefik middleware labels instead (`accesscontrolalloworiginlist`, `accesscontrolallowmethods`, `accesscontrolallowheaders`)

### Infrastructure

- Added `MINIO_SERVER_URL` env var to the MinIO container so it validates presigned URL hostnames correctly
- Added MinIO service to the `proxy` Traefik network and configured a public router at `minio.sfxproone.olliecross.com`
- Added `MINIO_PUBLIC_URL` to `.env.example`

---

## v1.0.0 - 2026-03-26

### Added

- QR code scanner always selects the rear camera by default (no camera picker shown)
- Sign-out button now correctly redirects to the login page in production
- Footer on every page with credits, social links (Instagram, LinkedIn, GitHub) and a link to release notes
- Release notes page at `/changelog` rendered from `CHANGELOG.md`

### Infrastructure

- Fixed `NEXTAUTH_URL` pointing to `localhost:3000` in production environment
- Added `marked` for server-side markdown rendering

---

## v0.9.0 - Phase 9

### Deployed

- Application live at `https://sfxproone.olliecross.com` with valid Let's Encrypt certificate
- Credentials login and Authentik OIDC SSO both functional
- Automatic database migrations on container start via `entrypoint.sh`
- All 4 containers healthy: app, postgres, redis, minio

---

## v0.8.0 - Phase 8

### Infrastructure

- Traefik v3 reverse proxy with automatic HTTPS (Let's Encrypt)
- Authentik OIDC deployed at `https://auth.sfxproone.olliecross.com`
- Role claims (`ADMIN`, `EDITOR`, `VIEWER`) mapped from Authentik groups via scope expression
- DNS configured and pointing to server public IP

---

## v0.7.0 - Phase 7

### Added

- Admin dashboard: user table with inline role selector
- Redis sliding-window rate limiting on login (5 attempts / 60 s)
- Upload rate limiting: 429 after 20 requests per user per 60 s

### Infrastructure

- Multi-stage Dockerfile: deps - builder - runner (standalone, non-root user)
- `entrypoint.sh` runs `prisma migrate deploy` before starting the server

---

## v0.6.0 - Phase 6

### Added

- Case editor: create and edit cases with gear list, images, and PDFs
- Direct file uploads via MinIO pre-signed PUT URLs (no Next.js bottleneck)
- HEIC/HEIF - JPEG conversion client-side via `heic2any`
- Image resize/compress: max 1920 px, quality 0.8 via `browser-image-compression`
- Camera capture or file picker for photo uploads
- Drag-to-reorder gear list items
- Move items between cases via dropdown

---

## v0.5.0 - Phase 5

### Added

- QR code scanner page with manual code entry fallback
- Case detail page: gear list, image gallery with lightbox, PDF viewer
- Legacy Google Keep QR code URLs supported (looked up by `qrdata` field)
- Pre-signed GET URLs generated server-side (never exposed to client)

---

## v0.4.0 - Phase 4

### Added

- Login page with credentials form, loading state, and error display
- Role-aware header: nav links hidden below required role
- Role badge (Admin / Editor / Viewer)
- `AuthGuard` client component enforcing RBAC on protected routes

---

## v0.3.0 - Phase 3

### Added

- API routes: cases CRUD, QR lookup, MinIO pre-signed URL generation
- Zod validation on all request bodies
- MIME type allowlist for uploads
- Session + role checks on every route (401 / 403)

---

## v0.2.0 - Phase 2

### Added

- Prisma singleton client
- NextAuth v5 with credentials provider and optional Authentik OIDC
- MinIO S3 client with `ensureBucket` / `getFileUrl` / `deleteFile` helpers
- Redis singleton for rate limiting
- `usePermissions` and `useUpload` hooks

---

## v0.1.0 - Phase 1

### Added

- Project scaffold: Next.js 15 App Router, TypeScript, Tailwind CSS
- Prisma schema: User, Case, Item, Image, Document models
- Docker Compose stack: postgres, redis, minio, nextjs-app
- Environment variable template (`.env.example`)
