# TOPPER MANTRA ADMIN CONTROL CENTER — SYSTEM ARCHITECTURE & TELEMETRY SPECIFICATION

---

## 1. EXECUTIVE SUMMARY & CORE PHILOSOPHY

The **Topper Mantra Admin Control Center** is an **Industry-Grade Multi-Tenant Educational ERP & Deep Telemetry Dashboard** (comparable to Datadog, Coursera Enterprise, and Stripe Sigma) designed as the centralized operational view layer for the Topper Mantra educational ecosystem.

### Key Architectural Mandates
* **Multi-Tenant Institutional Provisioning**: Administrators have total centralized control over partner schools (e.g., *Indirapuram Public School, Ayodhya*, *DPS*, *DAV*), custom Xcode/app branding, seat allocations, and license generation.
* **Granular Video & Curriculum Allocation Matrix**: Precise staged rollout controls (Early Access vs Scheduled Date vs Immediate) governing which masterclasses and lecture playlists are distributed to which institutional tenants.
* **Deep Institutional Telemetry**: Instant drill-down into any partner school to inspect seat utilization gauges, cohort engagement curves, curriculum completion rates, and doubt SLA queues.
* **360° Student Learning Dossiers**: Complete individual dossiers tracking video progress %, exact watch history, doubt resolution logs with SLA turnaround times, live session attendance, daily streaks, and account access enforcement (suspend / reinstate / revoke tokens).
* **Single Source of Truth**: The Hostinger VPS Backend (`http://187.127.111.105/api/v1`) owns database state, caching, business logic, authorization guards, and video delivery pipelines.

---

## 2. SYSTEM TOPOLOGY & NETWORK FLOW

```text
                                  CLIENT BROWSER
                         Executive Dark Mode UI / Next.js 14
                                         │
                                         │ 1. HTTP API Requests (`/api/v1/*`)
                                         ▼
                             Next.js Rewrite Proxy
                             `next.config.js` -> `http://187.127.111.105/api/v1`
                                         │
                                         │ 2. Server-to-Server Bearer Auth Passthrough
                                         ▼
                            Hostinger VPS Backend
                       `http://187.127.111.105/api/v1`
                                         │
                     ┌───────────────────┼───────────────────┐
                     ▼                   ▼                   ▼
                PostgreSQL             Redis            Bunny Stream & Storage
             (Database State)      (Session/Cache)     (Video Delivery & Notes)
```

---

## 3. PROJECT DIRECTORY STRUCTURE

```text
TM Admin Panel
├── src/
│   ├── api/                           # Centralized API Service Layer
│   │   ├── auth.ts                    # Authentication & OTP API calls
│   │   ├── dashboard.ts               # Analytics & System metrics API calls
│   │   ├── discussions.ts             # Trust, Safety & Moderation API
│   │   ├── doubts.ts                  # Doubt queue claiming & resolution APIs
│   │   ├── index.ts                   # Barrel export for API modules
│   │   ├── liveSessions.ts            # Live Masterclasses & Event Dispatcher API
│   │   ├── media.ts                   # Media Library (Bunny CDN PDFs & notes)
│   │   ├── mentors.ts                 # Mentor onboarding, removal & shuffle APIs
│   │   ├── opportunities.ts           # Student hackathons & scholarships API
│   │   ├── schools.ts                 # Multi-tenant schools, deep analytics & release schedules
│   │   ├── students.ts                # Student directory & 360° dossier telemetry APIs
│   │   ├── systemHealth.ts            # Cluster health & VPS latency ping API
│   │   └── videos.ts                  # Video library & school assignment APIs
│   ├── app/                           # Next.js App Router Pages
│   │   ├── dashboard/page.tsx         # Executive Dashboard, DAU/WAU chart, heatmap, live stream
│   │   ├── discussions/page.tsx       # Trust & Safety moderation queue and action drawer
│   │   ├── doubts/page.tsx            # Doubt resolution queue & 30m SLA monitor
│   │   ├── inspire/page.tsx           # Granular Video CMS & Multi-School Distribution Hub
│   │   ├── live-sessions/page.tsx     # Live Masterclasses & webinar dispatcher
│   │   ├── opportunities/page.tsx     # Student hackathons, fellowships & grants
│   │   ├── resources/page.tsx         # Explore Resources & Curriculum study notes
│   │   ├── mentors/page.tsx           # Mentor directory & app priority shuffle
│   │   ├── schools/                   # Multi-Tenant Institutional School Management
│   │   │   ├── page.tsx               # School catalog table & coupon generation
│   │   │   └── [id]/page.tsx          # School Deep-Dive Analytics & Curriculum Matrix
│   │   ├── students/                  # Students Roster
│   │   │   ├── page.tsx               # Student directory with multi-column filters & export
│   │   │   └── [id]/page.tsx          # 360° Student profile and learning dossier
│   │   ├── globals.css                # Topper Mantra Executive Dark Mode & Design Tokens
│   │   ├── layout.tsx                 # Root layout with ThemeProvider & QueryProvider
│   │   └── page.tsx                   # Admin & Mentor authentication portal
│   ├── components/                    # Reusable UI Layout Components
│   │   ├── Header.tsx                 # Top navigation, global Cmd+K search & theme toggle
│   │   ├── Sidebar.tsx                # Sidebar hierarchy with live system health indicator
│   │   └── StudentDrawer.tsx          # 360° Student Dossier slide-over sheet UI
│   ├── context/                       # Context Providers
│   │   └── ThemeContext.tsx           # Executive Dark Mode <-> Crisp Light Theme toggle
│   ├── lib/                           # Utility & Client Configurations
│   │   ├── api.ts                     # Axios client with Bearer interceptors
│   │   ├── bunnyStorage.ts            # Direct Bunny CDN storage & stream upload helpers
│   │   └── exportUtils.ts             # 1-click clean CSV/Excel table exporter
│   └── providers/
│       └── QueryProvider.tsx          # TanStack React Query v5 provider
├── .env.local                         # Local environment variables (VPS & Bunny CDN)
├── package.json                       # Dependencies & build scripts
├── tailwind.config.js                 # Tailwind CSS styling & executive color tokens
└── ARCHITECTURE.md                    # Complete System Architecture Documentation
```

---

## 4. DETAILED MODULE ARCHITECTURE

### 4.1 Executive Dashboard & Live Telemetry (`/dashboard`)
* **KPI Metrics**: Dynamic count of Total Students (+12.4% MoM indicator), INR Revenue (`₹ 47,984` with B2C vs B2B breakdown), Active Mentors, and Doubt Resolution Rate (`17.6%`, 3 doubts solved).
* **Engagement Velocity Curves**: Toggle between DAU, WAU, and MAU across 7d, 30d, 90d periods.
* **Peak Study Hours Heatmap**: 7 days x 6 time blocks density matrix identifying student peak study and video streaming hours.
* **Live Platform Stream**: Real-time ticker showing incoming doubts, coupon activations, video completions, and moderation flags.

### 4.2 Multi-Tenant School Provisioning & Deep Analytics (`/schools` & `/schools/[id]`)
* **School Catalog View (`/schools`)**:
  - Catalog Table: School Name, Tenant Code (`IPS-AYODHYA`, `DPS001`, `DAV2026`), City/State, Total Allocated Seats, Claimed Licenses, Active Students (24h), and Quick Actions.
  - Onboard New School Modal: Submits name, code, location, and seat quota to `POST /api/v1/admin/schools`.
  - Bulk Access Code Generator: Generates seat batches with custom prefix and validity period, with instant CSV export.
  - 1-Click CSV/Excel Catalog Export.
* **School Deep-Dive Analytics (`/schools/[id]`)**:
  - **Institutional KPI Grid**: Seat Utilization % circular gauge, Active Enrolled 24h count, Average Video Completion %, Unresolved Doubts Count.
  - **Cohort Engagement Curve**: School-specific daily active students and collective watch-hours trendline (7d, 30d, 90d).
  - **Curriculum & Video Access Matrix**:
    - Complete matrix of all videos allocated to this school.
    - **Staged Release Policy**: Toggle between `IMMEDIATE`, `EARLY_ACCESS`, and `SCHEDULED` (with future target live date).
    - **Allocate Videos**: Assign single lectures or bulk batches to the school (`POST /api/v1/admin/schools/:id/videos`).
    - **Revoke Access**: Remove video assignment with one click.
  - **Enrolled Student Directory**:
    - Table of all students registered under this school code (`GET /api/v1/admin/schools/:id/students`).
    - Clickable student rows opening the 360° Student Profile Dossier.

### 4.3 Granular Video CMS & Multi-School Distribution (`/inspire` & `/resources`)
* **Central Video Repository**: Filterable by Pillar (Academic, Hackathons, Entrepreneurship, Drone Technology, Inspire), Target Exam (JEE, NEET, CBSE Boards, CUET), and Class Level (Class 9-12, Dropper).
* **Provisioning Studio (`POST /api/v1/admin/videos`)**: Direct Bunny CDN / YouTube integration, 16:9 thumbnail upload, and Distribution Scope (Global vs Restrict & Multi-Select specific partner schools).
* **Bulk Video Provisioning Tool**: Multi-select lectures -> Assign to Schools -> Select 1 or more schools -> Set release schedule -> Apply batch distribution.

### 4.4 360° Student Profile & Learning Dossier (`/students/[id]` & `StudentDrawer`)
* Accessible anywhere across the application (via dedicated route `/students/[id]` and instant slide-over sheet drawer):
  - **Profile Header**: Full Name, Phone, Enrolled School Name & Code, Target Exam, Class Level, Account Status, Registered Date.
  - **Academic Watch History**: Lecture title, subject, watch timestamp, watch duration, completion %, status (`COMPLETED` / `IN_PROGRESS`).
  - **Doubts & Mentorship Activity**: Questions raised, assigned mentor, turnaround time, resolution preview, student 5-star rating.
  - **Live Masterclass Attendance**: Sessions attended vs registered, join timestamps.
  - **Gamification & Consistency**: Daily Streak, Total XP, Leaderboard Rank, community posts.
  - **Account Access Controls**: 1-click Account Suspension / Reinstatement and Token Revocation.

### 4.5 Mentors Directory & Doubt Resolution SLA (`/mentors` & `/doubts`)
* **Mentor Roster**: Subject experts, designation, organization, active student capacity, total resolved doubts, average rating, and drag/priority shuffle updating mobile app rankings in real-time.
* **Doubt Resolution Pipeline**: Real-time queue `OPEN` -> `CLAIMED` -> `RESOLVED`.
* **30-Minute SLA Monitor**: Highlights tickets exceeding resolution turnaround thresholds.
* **Subject Bottleneck Heatmap**: Visual breakdown of pending ticket demand across Physics, Chemistry, Mathematics, Biology & Tech.

### 4.6 Live Masterclasses & Event Dispatcher (`/live-sessions`)
* Interactive webinar schedule of `UPCOMING`, `LIVE`, and `COMPLETED` sessions.
* Create Masterclass with Target School Scope (`GLOBAL` vs school-restricted).
* Post-Session Publishing: Attach recorded video URL for immediate student replay.

### 4.7 Trust, Safety & Community Moderation (`/discussions`)
* Real-time triage of flagged forum questions and comments with reason tags (`SPAM`, `ABUSIVE_LANGUAGE`, `HARASSMENT`, `INAPPROPRIATE_CONTENT`).
* Action Drawer: Inspect snippet, review author history and previous strikes, and enforce one-click discipline (**Dismiss**, **Delete Content & Warn User**, **Suspend Account**).

### 4.8 Opportunities Hub (`/opportunities`)
* Curated directory of Hackathons (e.g. Smart India Hackathon), Scholarships, Fellowships (e.g. DGCA Drone Aerospace Fellowship), and Research Grants for students.

---

## 5. ENTERPRISE CONTROLS & NON-FUNCTIONAL SPECIFICATIONS

1. **Global Search (`Cmd + K` / `Ctrl + K`)**: Instant search overlay across Students, Schools, Videos, and Queues with jump navigation.
2. **Slide-Over Drawers (Sheet UI)**: Inspect student dossiers and flagged moderation items without losing table scroll state.
3. **Topper Mantra Executive Dark Mode**: Obsidian Zinc-950 (`#09090b`), Slate-900 (`#0f172a`), crisp border (`#27272a`), vibrant purple (`#7C3AED`), cyan (`#3B82F6`), emerald (`#10B981`), amber (`#F59E0B`), and brand orange (`#f97316`). Includes instant Light Mode toggle.
4. **1-Click CSV/Excel Export**: Integrated on every table (Schools, Students, Videos, Doubts, Masterclasses, Moderation) for executive reporting.
5. **System Health Indicator**: Live pulse badge in the sidebar footer showing VPS ping latency (45ms), PostgreSQL status, Redis cache, and Bunny CDN health.
