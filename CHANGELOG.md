# Changelog

All notable changes to SFXProOne CaseManager are documented here.

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

## v0.9.0 - Phase 9 Complete

### Deployed

- Application live at `https://sfxproone.olliecross.com` with valid Let's Encrypt certificate
- Credentials login and Authentik OIDC SSO both functional
- Automatic database migrations on container start via `entrypoint.sh`
- All 4 containers healthy: app, postgres, redis, minio

---

## v0.8.0 - Phase 8 Complete

### Infrastructure

- Traefik v3 reverse proxy with automatic HTTPS (Let's Encrypt)
- Authentik OIDC deployed at `https://auth.sfxproone.olliecross.com`
- Role claims (`ADMIN`, `EDITOR`, `VIEWER`) mapped from Authentik groups via scope expression
- DNS configured and pointing to server public IP

---

## v0.7.0 - Phase 7 Complete

### Added

- Admin dashboard: user table with inline role selector
- Redis sliding-window rate limiting on login (5 attempts / 60 s)
- Upload rate limiting: 429 after 20 requests per user per 60 s

### Infrastructure

- Multi-stage Dockerfile: deps - builder - runner (standalone, non-root user)
- `entrypoint.sh` runs `prisma migrate deploy` before starting the server

---

## v0.6.0 - Phase 6 Complete

### Added

- Case editor: create and edit cases with gear list, images, and PDFs
- Direct file uploads via MinIO pre-signed PUT URLs (no Next.js bottleneck)
- HEIC/HEIF - JPEG conversion client-side via `heic2any`
- Image resize/compress: max 1920 px, quality 0.8 via `browser-image-compression`
- Camera capture or file picker for photo uploads
- Drag-to-reorder gear list items
- Move items between cases via dropdown

---

## v0.5.0 - Phase 5 Complete

### Added

- QR code scanner page with manual code entry fallback
- Case detail page: gear list, image gallery with lightbox, PDF viewer
- Legacy Google Keep QR code URLs supported (looked up by `qrdata` field)
- Pre-signed GET URLs generated server-side (never exposed to client)

---

## v0.4.0 - Phase 4 Complete

### Added

- Login page with credentials form, loading state, and error display
- Role-aware header: nav links hidden below required role
- Role badge (Admin / Editor / Viewer)
- `AuthGuard` client component enforcing RBAC on protected routes

---

## v0.3.0 - Phase 3 Complete

### Added

- API routes: cases CRUD, QR lookup, MinIO pre-signed URL generation
- Zod validation on all request bodies
- MIME type allowlist for uploads
- Session + role checks on every route (401 / 403)

---

## v0.2.0 - Phase 2 Complete

### Added

- Prisma singleton client
- NextAuth v5 with credentials provider and optional Authentik OIDC
- MinIO S3 client with `ensureBucket` / `getFileUrl` / `deleteFile` helpers
- Redis singleton for rate limiting
- `usePermissions` and `useUpload` hooks

---

## v0.1.0 - Phase 1 Complete

### Added

- Project scaffold: Next.js 15 App Router, TypeScript, Tailwind CSS
- Prisma schema: User, Case, Item, Image, Document models
- Docker Compose stack: postgres, redis, minio, nextjs-app
- Environment variable template (`.env.example`)
