# Topper Mantra Admin Panel — Architecture

The admin and mentor web console for Topper Mantra. It is a thin client: all data,
authorisation and storage live in the TM Backend (NestJS). The API contract it
builds against is `docs/api/admin-v2-contract.md` in the backend repo.

## Stack

- Next.js 14 (App Router, client components), TypeScript, Tailwind CSS (light theme, indigo accent, Inter)
- `@tanstack/react-query` for data fetching and caching (30 s for analytics, 60 s for lists)
- `axios` API client (`src/lib/api.ts`), `recharts` for charts, `tus-js-client` for resumable video uploads

## Request flow

```text
Browser ──/api/v1/*──▶ Next.js rewrite (next.config.js) ──▶ TM Backend (BACKEND_API_URL)/api/v1/*
                                                            ├─ PostgreSQL
                                                            ├─ Redis
                                                            └─ Bunny Storage / Stream (keys live only on the backend)
```

- The browser only ever calls same-origin `/api/v1`. The backend URL is set with the server-side env var `BACKEND_API_URL`.
- No API keys or credentials are shipped to the browser. Bunny keys exist only on the backend.

## Authentication

| Who | How | Token |
|---|---|---|
| Admin | Email + password → `POST /admin/auth/login` | 12 h admin JWT |
| Mentor | Phone OTP → `/auth/send-otp`, `/auth/verify-otp` (role must be MENTOR or ADMIN) | app JWT |

- `src/lib/session.ts` stores the token and user in `localStorage`.
- `AppShell` redirects to `/` when there is no session, keeps mentors on `/doubts`, and re-checks the token with the backend (`/admin/auth/me` or `/auth/me`).
- Any 401 response clears the session and returns to the login page.
- The client-side guard is only for UX. The backend enforces roles on every request.

## Uploads

| What | Flow |
|---|---|
| Images, thumbnails, banners, PDFs | `FileUploader` / `uploadToCdn()` → `POST /admin/uploads/file?folder=…` (multipart). Images are resized in the browser first. Limits: 10 MB images, 50 MB PDFs. |
| Videos | `VideoUploader`: `POST /admin/uploads/video` returns signed TUS headers → the browser uploads straight to Bunny over TUS (resumable, with pause/resume/retry) → polls `GET /admin/uploads/video/:guid/status` until `READY`. A video saved while it is still encoding is stored as `PROCESSING` and switched to `READY` when encoding finishes. |

## Pages

| Area | Route | Data |
|---|---|---|
| Overview | `/dashboard` | `/admin/analytics/overview`, `/hourly`, `/videos`, `/features` |
| Analytics | `/analytics/students`, `/analytics/students/[id]` | per-student time in app, active hours, sections, screens, taps, videos |
| | `/analytics/engagement` | hourly, day×hour heatmap, sections, screens, taps |
| | `/analytics/content` | recording leaderboard |
| | `/analytics/mentors` | doubt resolution and ratings |
| Content | `/live-content`, `/media-library`, `/masterclasses`, `/opportunities`, `/mentors` | existing `/admin/*` CRUD |
| Operations | `/schools`, `/doubts`, `/students` | existing `/admin/*`, `/doubts/*` |
| System | `/system` | `/admin/system/health` (DB and Redis latency, per-route p50/p95/p99), refreshes every 10 s |

Screen-level and tap-level analytics depend on the mobile app sending events. See `docs/integration/mobile-analytics-events.md` in the backend repo. Until it does, those sections show an explanatory empty state, not made-up numbers.

## Code layout

```text
src/
  app/            routes (each page wraps its content in <AppShell>)
  components/ui/  design kit: Button, Field/Input/Select, Card, StatCard, Badge, Tabs/Segmented,
                  RangePicker, Modal/Drawer, DataTable/Pagination, Skeleton/Empty/Error states
  components/     AppShell, FileUploader, VideoUploader, charts, StudentReportModal
  api/            typed API modules (analytics, system, uploads, adminAuth, plus the content/school modules)
  lib/            api client, session, formatting, image helpers
  hooks/          useRange (shared analytics range)
```

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `BACKEND_API_URL` | server | Backend origin used by the rewrite (default `http://187.127.111.105`) |

Security headers set in `next.config.js`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
