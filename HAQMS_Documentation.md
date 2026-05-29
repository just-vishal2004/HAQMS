# HAQMS – Audit, Fix & Optimization Report

## Issues Identified & Fixes Implemented

### Challenge 1 — Security

**S-1: Plaintext Password Logging**
Removed console.log statements that printed raw passwords on every login and registration attempt.

**S-2: Password Hash in Response**
Updated register endpoint to use Prisma select — password field never returned to client.

**S-3: JWT Expiry Ignored**
Removed ignoreExpiration: true from jwt.verify. Changed token lifetime from 365 days to 8 hours.

**S-4: Hardcoded JWT Secret**
Removed hardcoded fallback. Server now exits on startup if JWT_SECRET env variable is missing.

**S-5: Bypassed Admin Authorization**
Uncommented and enforced the role check in authorizeAdminOnly. Previously any authenticated user could delete patient records.

**S-6: SQL Injection in Doctor Search**
Replaced $queryRawUnsafe with string interpolation with Prisma findMany using contains and mode: insensitive — fully parameterized.

**S-7: Overly Permissive CORS**
Replaced app.use(cors()) with an origin allowlist driven by ALLOWED_ORIGINS environment variable.

**S-8: Hardcoded API URL**
Moved API base URL to NEXT_PUBLIC_API_URL environment variable in both AuthContext.js and queue/page.js.

---

### Challenge 2 — Performance & Concurrency

**P-1: N+1 Queries in Appointments**
Removed for-loop that ran 2 DB queries per appointment. Replaced with single findMany using include: { patient, doctor }.

**P-2: Sequential Stats Queries**
Wrapped 4 independent doctor stats queries in Promise.all — now run concurrently.

**P-3: Slow Report Endpoint**
Replaced per-doctor sequential loop (5 queries x N doctors + 80ms sleep) with 5 parallel groupBy aggregates using Promise.all. Fixed from O(n) to O(1) DB round-trips.

**P-4: Race Condition in Queue Check-in**
Wrapped the read-then-insert in prisma.$transaction with isolationLevel: Serializable. Removed the artificial 350ms setTimeout.

---

### Challenge 3 — Database & Schema

**D-1: Double-booking Not Prevented**
Added @@unique([doctorId, appointmentDate]) to Appointment model.

**D-2 to D-6: Missing Indices**
Added indices on Doctor (department, specialization), Appointment (doctorId+status, patientId), QueueToken (doctorId+createdAt, status).

**D-7: In-memory Pagination**
Replaced fetch-all-then-slice pattern with Prisma skip/take and database-side where filters with parallel count query.

---

### Challenge 4 — Frontend

**F-1: Memory Leak in Queue Page**
Added return () => clearInterval(intervalId) cleanup to useEffect. Previously every mount created a new polling timer that ran forever.

**F-2: Search Debounce**
Wrapped fetchPatients in 300ms setTimeout with clearTimeout cleanup — API fires only after user stops typing.

**F-3: Null Crash on Medical History**
Changed medicalHistory.toUpperCase() to medicalHistory?.toUpperCase() ?? 'No medical history recorded.'

**F-4: Missing Link Import**
Added import Link from 'next/link' to dashboard/page.js.

---

### Challenge 5 — Missing Feature

Built src/app/patients/[id]/history-records/page.js from scratch. Fetches patient data and appointment history, handles null medical history, loading/error states, and back navigation.

---

## Remaining Known Issues

- Auth token stored in localStorage (more secure alternative: HttpOnly cookies)
- Input validation is minimal — a library like zod would provide consistent schema-driven validation
- No unit or integration tests exist

---

## Approach & Engineering Decisions

Prioritized issues by impact: security first (credential exposure, broken auth), then correctness (race condition, null crash), then performance (N+1, sequential queries), then polish.

Used serializable transaction for queue check-in instead of retry logic — keeps the solution centralized and avoids application-level retry loops.

Used 30-minute booking window instead of exact millisecond check — more realistic for clinical systems where consultations have minimum duration.
