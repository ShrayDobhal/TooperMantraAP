# TOPPER MANTRA ADMIN PANEL — COMPLETE ARCHITECTURE & SYSTEM SPECIFICATION

---

## 1. EXECUTIVE SUMMARY & CORE PHILOSOPHY

The **Topper Mantra Admin Panel** is a Next.js 14 web application designed as a dedicated client interface for managing the Topper Mantra educational ecosystem.

### Key Architectural Mandates
* **Single Source of Truth**: The Hostinger VPS Backend (`http://187.127.111.105/api/v1`) owns all database state, caching, business logic, authorization guards, and third-party services.
* **No Direct DB / Redis Connections**: The Admin Panel does NOT connect directly to PostgreSQL, Prisma, Redis, or Bunny Stream. It communicates exclusively via RESTful HTTP API calls.
* **No Production Mock Data**: All metrics, school profiles, license codes, student rosters, mentor directories, and video metadata displayed in the Admin Panel come dynamically from the backend APIs.
* **Stateless Client Architecture**: The Admin Panel acts as a secure, reactive view layer over the backend API surface.

---

## 2. SYSTEM TOPOLOGY & NETWORK FLOW

```text
                                  VERCEL
                            TOPPER MANTRA ADMIN
                                     │
                                     │ 1. Client HTTP Requests (`/api/v1/*`)
                                     ▼
                      Next.js API Proxy Handler
                      `src/app/api/v1/[...path]/route.ts`
                                     │
                                     │ 2. Server-to-Server Proxy Request
                                     ▼
                   Hostinger VPS Backend Server
                   `http://187.127.111.105/api/v1`
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
            PostgreSQL             Redis            Bunny Stream
         (Database State)      (Session/Cache)     (Video Streaming)
```

---

## 3. PROJECT DIRECTORY STRUCTURE

```text
e:\TM Admin Panel
├── src/
│   ├── api/                           # Centralized API Service Layer
│   │   ├── auth.ts                    # Authentication & OTP API calls
│   │   ├── dashboard.ts               # Analytics & System metrics API calls
│   │   ├── doubts.ts                  # Doubt queue claiming & resolution APIs
│   │   ├── index.ts                   # Barrel export for API modules
│   │   ├── mentors.ts                 # Mentor onboarding, removal & shuffle APIs
│   │   ├── schools.ts                 # Institutional school & license APIs
│   │   ├── students.ts                # Student directory & status toggle APIs
│   │   └── videos.ts                  # Video library & school assignment APIs
│   ├── app/                           # Next.js App Router Pages & API Proxy
│   │   ├── api/v1/[...path]/route.ts  # Next.js Serverless Proxy Handler
│   │   ├── dashboard/page.tsx         # Real-time Analytics Dashboard
│   │   ├── doubts/page.tsx            # Doubt Resolution Queue
│   │   ├── live-content/page.tsx      # Video Library & School Video Assignments
│   │   ├── mentors/page.tsx           # Mentor Directory & App Priority Shuffle
│   │   ├── schools/page.tsx           # Institutional School Licenses & Coupons
│   │   ├── students/page.tsx          # Registered Student Directory
│   │   ├── globals.css                # Master CSS, tokens, table styles & shimmer animations
│   │   ├── layout.tsx                 # Root Layout wrapper
│   │   └── page.tsx                   # Portal Sign In Page (Admin & Mentor)
│   ├── components/                    # Reusable UI Layout Components
│   │   ├── Header.tsx                 # Top navigation header & user session badge
│   │   └── Sidebar.tsx                # Dynamic sidebar navigation (Admin / Mentor)
│   └── lib/                           # Utility & Axios Client Configurations
│       └── api.ts                     # Shared Axios instance with Bearer interceptors
├── .env.local                         # Local environment variables
├── package.json                       # Dependencies & build scripts
├── tailwind.config.js                 # Tailwind CSS styling configuration
└── ARCHITECTURE.md                    # System Architecture Documentation
```

---

## 4. NEXT.JS SERVERLESS PROXY HANDLER

### Path: [`src/app/api/v1/[...path]/route.ts`](file:///e:/TM%20Admin%20Panel/src/app/api/v1/%5B...path%5D/route.ts)

To eliminate Cross-Origin Resource Sharing (CORS) issues in browser environments and securely forward requests from Vercel serverless nodes to the backend server, the application uses a catch-all route proxy handler.

```ts
import { NextRequest, NextResponse } from 'next/server';

const TARGET_BACKEND = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://187.127.111.105/api/v1').replace(/\/$/, '');

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join('/') : '';
  const searchParams = req.nextUrl.search;
  const targetUrl = `${TARGET_BACKEND}/${path}${searchParams}`;

  const headers = new Headers();
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers.set('authorization', authHeader);
  }
  headers.set('content-type', req.headers.get('content-type') || 'application/json');

  let body: any = null;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      body = await req.text();
    } catch (e) {
      body = null;
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body ? body : undefined,
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
```

### Key Responsibilities
1. **Dynamic Target Resolution**: Resolves the target backend using `BACKEND_API_URL`, `NEXT_PUBLIC_API_URL`, or defaults to `http://187.127.111.105/api/v1`.
2. **Authorization Header Passthrough**: Preserves and forwards `Authorization: Bearer <token>` headers sent by the client.
3. **HTTP Verb Support**: Handles `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.

---

## 5. MODULAR API CLIENT SERVICE LAYER

### Central Axios Client: [`src/lib/api.ts`](file:///e:/TM%20Admin%20Panel/src/lib/api.ts)

* **Base URL**: Set to `/api/v1` in browser environments (proxying through Next.js) and `NEXT_PUBLIC_API_URL` during server-side execution.
* **Request Interceptor**: Reads `localStorage.getItem('tm_token')` and automatically attaches `Authorization: Bearer <token>` to every outgoing request.
* **Response Interceptor**: Extracts the `data` payload and unwraps error messages from standard backend error structures (`{ success: false, error: { message } }`).

### API Modules (`src/api/`)

| Module | Responsible Endpoint Surface | Key Functions |
| :--- | :--- | :--- |
| [`auth.ts`](file:///e:/TM%20Admin%20Panel/src/api/auth.ts) | `/auth/*` | `login()`, `sendOtp()`, `verifyOtp()`, `getMe()` |
| [`dashboard.ts`](file:///e:/TM%20Admin%20Panel/src/api/dashboard.ts) | `/admin/dashboard/stats` | `getStats()` |
| [`schools.ts`](file:///e:/TM%20Admin%20Panel/src/api/schools.ts) | `/admin/schools/*` | `getSchools()`, `createSchool()`, `generateLicense()`, `updateSchoolStatus()`, `getSchoolVideoStats()` |
| [`videos.ts`](file:///e:/TM%20Admin%20Panel/src/api/videos.ts) | `/admin/videos/*` | `getVideos()`, `createVideo()`, `updateVideo()`, `deleteVideo()`, `assignVideoToSchools()` |
| [`students.ts`](file:///e:/TM%20Admin%20Panel/src/api/students.ts) | `/admin/users?role=STUDENT` | `getStudents()`, `updateStudentStatus()` |
| [`mentors.ts`](file:///e:/TM%20Admin%20Panel/src/api/mentors.ts) | `/admin/mentors/*`, `/mentors` | `getMentors()`, `createMentor()`, `deleteMentor()`, `reorderMentors()` |
| [`doubts.ts`](file:///e:/TM%20Admin%20Panel/src/api/doubts.ts) | `/doubts/*` | `getDoubtPool()`, `claimDoubt()`, `resolveDoubt()` |

---

## 6. PAGE-BY-PAGE TECHNICAL BREAKDOWN

### 6.1 Sign In Page: [`src/app/page.tsx`](file:///e:/TM%20Admin%20Panel/src/app/page.tsx)
* **Role Selection Tabs**: Switch between **Admin Portal** (Email & Password) and **Mentor Login** (Mobile OTP).
* **Admin Login**:
  - Validates credentials (`toppermantrainfo@gmail.com` / `#UnicornTopperMantra2029`).
  - Acquires a backend-signed JWT token (`9999999999` ADMIN account) from `authApi.verifyOtp`.
  - Sets `tm_token`, `tm_user`, `tm_role = 'ADMIN'` in `localStorage`.
  - Navigates synchronously to `/dashboard`.
* **Mentor Login**:
  - Two-step flow: `sendOtp(phone)` -> `verifyOtp(phone, otp)`.
  - Validates role from response (`MENTOR`). Rejects `STUDENT` accounts.
  - Sets `tm_token`, `tm_user`, `tm_role = 'MENTOR'` in `localStorage`.
  - Navigates synchronously to `/doubts`.

### 6.2 Dashboard Control Center: [`src/app/dashboard/page.tsx`](file:///e:/TM%20Admin%20Panel/src/app/dashboard/page.tsx)
* **Real-time Analytics**: Consumes `dashboardApi.getStats()`.
* **Metrics Rendered**:
  - Total Registered Students
  - Active Paid Subscriptions
  - Total Onboarded Subject Mentors
  - Total Doubts Resolved & Resolution Percentage
  - Real-time Revenue (converted from paise to `₹`)
  - DAU / MAU Engagement Trends Chart
* **Error Handling**: Displays an error banner with a manual `[Retry]` trigger if backend connection fails.

### 6.3 Institutional School & License Management: [`src/app/schools/page.tsx`](file:///e:/TM%20Admin%20Panel/src/app/schools/page.tsx)
* **School Directory**: Consumes `schoolsApi.getSchools()`.
* **Data Displayed**: School Name, Code, Location (City, State), Status Badge (`ACTIVE` / `INACTIVE`), Seat allocations (Total, Allocated, Remaining), Videos Assigned, and Missing Videos Flag.
* **Register New School Modal**: Submits Name, School Code, City, State, Contact Email, Contact Phone, and Max License Seats via `schoolsApi.createSchool()`.
* **Generate Bulk Access Code Modal**: Submits License Duration, Seat Limit, and Expiry Date via `schoolsApi.generateLicense()`. Refetches school list dynamically so generated access codes display instantly in the UI.
* **School Status Toggle**: Switches school access between `ACTIVE` and `INACTIVE` via `schoolsApi.updateSchoolStatus()`.

### 6.4 Central Video Library & School Video Assignments: [`src/app/live-content/page.tsx`](file:///e:/TM%20Admin%20Panel/src/app/live-content/page.tsx)
* **Video Content Management**: Consumes `videosApi` and `schoolsApi`.
* **Multi-Field Filters**: Search query, Category (Academic, Hackathon, Drone, Workshop, Mentorship, Strategy, Career, Entrepreneurship, Community, Event), Exam (JEE, NEET, CUET, Boards), Class Target, and Assigned School filter.
* **Upload / Add Video Modal**: Accepts Video Title, Description, Stream URL / Bunny ID, YouTube Video ID, Thumbnail Poster URL, Category, Exam, Class Target, and Tags.
* **Assign Video to Schools Modal**: Interactive multi-select dialog allowing admins to assign or unassign a specific video across registered partner schools (`videosApi.assignVideoToSchools()`).

### 6.5 Student Directory: [`src/app/students/page.tsx`](file:///e:/TM%20Admin%20Panel/src/app/students/page.tsx)
* **Student Roster**: Consumes `studentsApi.getStudents()`.
* **Functionality**:
  - Search filter by student name, phone number, or school name.
  - Status toggle action (`ACTIVE` <-> `SUSPENDED`) via `studentsApi.updateStudentStatus()`.

### 6.6 Mentors Directory & Priority Ranking: [`src/app/mentors/page.tsx`](file:///e:/TM%20Admin%20Panel/src/app/mentors/page.tsx)
* **Mentor Management**: Consumes `mentorsApi`.
* **Onboarding Modal**: Captures Mentor Name, Subject Expertise, Phone, Email, Designation, Organization/College, Bio, and Avatar Image URL (`mentorsApi.createMentor()`).
* **Priority Rank Reordering**: Enables drag/button reordering of subject experts (`mentorsApi.reorderMentors()`), updating priority order on the mobile app instantly.

### 6.7 Doubt Resolution Queue: [`src/app/doubts/page.tsx`](file:///e:/TM%20Admin%20Panel/src/app/doubts/page.tsx)
* **Queue Management**: Consumes `doubtsApi.getDoubtPool()`.
* **Workflow**:
  1. Mentors view pending academic questions submitted by students.
  2. Click **Claim Ticket** (`doubtsApi.claimDoubt()`) to lock ticket to mentor session.
  3. Submit step-by-step solution text or video explanation link (`doubtsApi.resolveDoubt()`) to mark ticket resolved.

---

## 7. ENVIRONMENT VARIABLES & DEPLOYMENT

### Production Configuration (Vercel)
Set the environment variable in Vercel Project Settings:

```text
NEXT_PUBLIC_API_URL=http://187.127.111.105/api/v1
```

### Local Development Configuration (`.env.local`)

```text
NEXT_PUBLIC_API_URL=http://187.127.111.105/api/v1
```

---

## 8. BUILD & VERIFICATION COMMANDS

To test and compile the project locally:

```powershell
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build & TypeScript validation
npm run build
```

---

## 9. SECURITY & MAINTAINABILITY MANDATES

1. **No Private Secrets in Frontend**: Never place Bunny Stream API keys, PostgreSQL passwords, or Redis connection strings in browser code.
2. **Bearer Token Preservation**: Ensure `localStorage.getItem('tm_token')` is set whenever user authenticates so all subsequent API calls carry valid authorization.
3. **Stateless UI Logic**: Always trigger a data refetch (`fetchSchools()`, `fetchVideos()`, `fetchMentors()`) after mutation calls (`create`, `update`, `delete`, `assign`) to ensure UI remains in 100% sync with the backend database.
