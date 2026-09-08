# Exam Platform — Build Sequence Guide

This is the order to actually build the platform in — phase by phase, each one producing something testable before moving to the next. Building in this order avoids the two most common failure modes: frontend built against APIs that don't exist yet, and features built before the foundation (auth, roles, schema) is solid.

**General rule for every phase: backend piece first, test it directly (Postman/curl/Thunder Client), then build the frontend that calls it.** Never build a frontend screen against a backend endpoint you haven't verified works.

---

## Phase -1 — Accounts & local environment (before any code runs)

**Goal:** every external service exists and your machine can actually run the project. Skipping this and discovering mid-Phase-0 that you don't have a database is a common stall point.

1. Create accounts: GitHub, Vercel, Render, Supabase, Upstash, Cloudflare (R2), Anthropic (API key), Resend (or an SMTP provider) — do this once, up front, not as each phase needs one.
2. Install local tooling: Node.js, Docker, Terraform, k6.
3. Initialize the monorepo — root `package.json`, `turbo.json`, `tsconfig.base.json`, workspace folders per the folder structure.
4. Install dependencies across every app/package using the versions listed in `DEPENDENCIES.md`.
5. Write `infra/docker/docker-compose.yml` and bring up local Postgres + Redis with `docker compose up`. All local development happens against these, not against production Supabase/Upstash.
6. Write `.env.example` in the root and in each app; copy to real `.env`/`.env.local` files locally with dummy/dev values (real secrets come later, in Phase 10).
7. Write `scripts/setup-dev.sh` so this whole sequence becomes a single command for the next person (or agent) who clones the repo.
8. **Test checkpoint:** `docker compose up`, backend starts with `npm run start:dev`, and it connects to local Postgres/Redis without errors. Nothing functional yet — just "it boots."

---

## Phase 0 — Foundation (schema, auth, roles)

**Goal:** database schema, auth, and role enforcement exist. No features yet.

1. Write `prisma/schema.prisma` — at minimum: `User`, `Exam`, `Question`, `Topic`, `Attempt`, `Answer`, `Invite`, `AuditLog`, `Flag` models with relations. This is the single most important file to get right early — every other module depends on it.
2. Run the first migration (`npx prisma migrate dev --name init`) against the local Postgres from Phase -1.
3. Write `docs/PERMISSIONS.md` — the role × action matrix. Do this **before** writing `roles.guard.ts`, not after, so the guard implements a decided policy instead of an improvised one.
4. Build `packages/shared-types` — define `User`, `Exam`, `Question` TypeScript types now, since the backend and all three frontends will import these from day one instead of each redefining their own.
5. Build `packages/api-client` — a minimal typed HTTP client shell (even just the base Axios instance + auth header handling); endpoint functions get added as each backend module is built.
6. Build backend `health` module — a working `/health` endpoint. Build this now, not later — it's trivial, and CI/CD in Phase 10 depends on it existing.
7. Build backend `auth` module: login, JWT issuing, `jwt-auth.guard.ts`, `roles.guard.ts`.
8. Build backend `invites` module, including real email sending via Resend/Nodemailer (test with your own inbox) — admin creates an invite → email sent → user redeems it → sets password → account activated.
9. **Test checkpoint:** using Postman/curl only (no frontend yet) — create an invite, actually receive the email, redeem it, log in, get a JWT, hit one protected route successfully and one protected route with the wrong role and confirm it's rejected. Also hit `/health` and confirm 200.

At the end of Phase 0 you have: a database, working auth, role enforcement, shared types, and a health endpoint — but nothing visual yet.

---

## Phase 1 — Admin app (build this first, not student/teacher)

**Why admin first:** you can't log in as a teacher or student until an admin exists to invite them. Admin is the root of the whole access chain.

1. Build `packages/ui` — `Button.tsx`, `Input.tsx`, `Modal.tsx` — build these minimal shared components now, since admin-app is the first frontend and every later frontend should reuse them rather than reinventing styling three times.
2. Backend: `users` module (list/deactivate users), wire `admin.controller.ts` to expose invite-triggering and user-listing endpoints.
3. Backend: seed one hardcoded admin account directly in the database (via `seeds/`) — this is the one account that bootstraps everything else, since no one can invite the first admin.
4. Frontend (`admin-app`): login page → dashboard shell → `UserTable.tsx` + `AddUserModal.tsx` to invite a teacher and a student.
5. **Test checkpoint:** log in as the seeded admin, invite one teacher and one student through the actual UI, confirm both can redeem their invite and log in (even if their apps are still empty shells at this point).

At the end of Phase 1: admin can manage access end-to-end through a real UI.

---

## Phase 2 — Teacher app: exam & question creation

**Why teacher before student:** students can't take an exam that doesn't exist yet.

1. Backend: `topics` module (basic CRUD) — needed before questions, since questions reference topics.
2. Backend: `uploads` module — connect to Cloudflare R2, build image upload (for question images) and CSV parsing (for bulk question import). Build this now since Phase 2's bulk-upload UI needs it.
3. Backend: `questions` module — create/edit/list, including `topic` and `difficulty` fields on the entity from day one (don't add these later — retrofitting tagged data is painful, as flagged earlier).
4. Backend: `exams` module — create/edit/list, with `ownership.guard.ts` enforcing that a teacher only edits their own exams.
5. Frontend (`teacher-app`): login → dashboard → `exams/create` → `QuestionForm.tsx` with `TopicTagSelector.tsx`, `DifficultySelector.tsx`, and `BulkUpload.tsx`.
6. **Test checkpoint:** log in as the invited teacher, create one exam, add 5–10 questions with topics and difficulty tags (including at least one via bulk CSV upload and one with an uploaded image), confirm they persist and reload correctly.

At the end of Phase 2: a teacher can fully build an exam through the real UI.

---

## Phase 3 — Student app: the core exam-taking flow (this is the heart of the product)

Build this in sub-steps, testing each before adding the next:

1. Backend: `attempts` module — start an attempt, submit an individual answer, submit the whole exam. No adaptive logic, no AI grading yet — just: student sees fixed questions in order, picks answers, submits, gets a raw score.
2. Frontend: `dashboard/page.tsx` (list assigned exams) → `instructions/page.tsx` → `take/page.tsx` with `QuestionCard.tsx`, `AnswerOptions.tsx`, `ProgressBar.tsx`, `Timer.tsx`.
3. Wire `examStore.ts` (Zustand) to hold in-progress answers client-side.
4. Add `useAutosave.ts` — save answers to the backend periodically, not just on final submit.
5. Add `SubmitConfirmModal.tsx` and the actual submit flow.
6. Backend: basic scoring in `attempts.service.ts` — count correct MCQ answers, compute percentage.
7. Frontend: `result/page.tsx` with `ScoreSummary.tsx` (just the raw score for now — no topic breakdown yet).
8. **Test checkpoint:** as the invited student, take the full exam created in Phase 2 end-to-end — login → instructions → answer questions → autosave kicks in → submit → see a raw score. This is your first fully working vertical slice of the product.

**This is the most important milestone in the whole build** — everything after this phase is enrichment, not core functionality. If a school needed to pilot tomorrow, Phases 0–3 alone are a usable (if basic) exam platform.

---

## Phase 4 — Feature: Topic-wise weakness report (easiest add-on, build first)

1. Backend: `analytics` module — a service that groups a completed attempt's answers by topic and computes per-topic accuracy.
2. Frontend: `TopicBreakdownChart.tsx` on the student result page.
3. **Test checkpoint:** take another test exam, confirm the topic breakdown math is correct against a manually-calculated expectation.

---

## Phase 5 — Feature: Behavioral analytics + anti-cheating (build together, they share data)

1. Backend: extend `answer.entity.ts` usage to record time-per-question and answer-change count (already in the schema from Phase 0 if you included it — otherwise migrate now).
2. Frontend: `useTabSwitchDetection.ts` hook, wired into the `take/page.tsx` exam screen.
3. Backend: `integrity` module — question/option shuffling logic (applied when an attempt starts), flag recording for tab-switches.
4. Frontend (teacher-app): `IntegrityAlerts.tsx` on the exam monitor page (build the monitor page shell now if not yet built).
5. **Test checkpoint:** take an exam, deliberately switch tabs a few times, confirm a flag is recorded and visible to the teacher.

---

## Phase 6 — Feature: Teacher live/polling monitor dashboard

1. Backend: `dashboard` module — polling endpoint returning per-student status (active, submitted, flagged) for a given exam.
2. Frontend: `monitor/page.tsx` with `StudentGrid.tsx` and `LiveStats.tsx`, using `usePolling.ts` for the 20–30s refresh cycle.
3. **Test checkpoint:** open the monitor dashboard in one browser while taking the exam as a student in another, confirm status updates appear within the polling interval.

*(Note: build polling first, not WebSocket — per the pilot-stage stack decision. `dashboard.gateway.ts` can be added later without changing the frontend contract much.)*

---

## Phase 7 — Feature: AI-assisted grading (build last of the 6 features — most external dependency)

1. Add a subjective (long-answer) question type to `question.entity.ts` if not already supported, plus a rubric field.
2. Backend: `grading` module — `anthropic.client.ts` wrapper, `grading.service.ts` that sends the answer + rubric to Claude and stores a provisional score.
3. Frontend (teacher-app): `RubricEditor.tsx` (on question creation) and `AIGradeReview.tsx` (on the grading review page).
4. **Test checkpoint:** submit a subjective answer as a student, confirm the AI grade appears for teacher review, and that the teacher can override it and have the override persist as the final score.

---

## Phase 8 — Feature: Adaptive difficulty (build last overall — most algorithmically complex, and only matters once you have a real tagged question bank to select from)

1. Backend: `adaptive` module — logic to pick the next question's difficulty based on running performance in the current attempt.
2. Modify `attempts.service.ts` to call into `adaptive.service.ts` when serving the next question, instead of serving a fixed pre-set order.
3. **Test checkpoint:** take an exam answering deliberately well, then deliberately poorly, and confirm the question difficulty visibly shifts each way.

*(This is placed last because it changes how questions are served mid-exam — safer to build once the basic fixed-order flow in Phase 3 is rock solid and well-tested.)*

---

## Phase 9 — Admin logs & oversight (can be built in parallel with Phases 4–8, doesn't block anything)

1. Backend: `request-logger.middleware.ts` + `audit-log.entity.ts` writing on every significant action.
2. Frontend (admin-app): `logs/page.tsx`, `LogTable.tsx`, `LogFilters.tsx`, `login-history/page.tsx`, `integrity-flags/page.tsx`.
3. **Test checkpoint:** perform a mix of actions across all three apps (login, create exam, submit attempt, integrity flag), confirm every one shows up correctly in the admin log view.

---

## Phase 10 — CI/CD and infra (start this in parallel with Phase 3, don't leave it until the end)

Realistically, you should set up CI as soon as Phase 0–1 code exists, not wait until the whole app is built:

1. Set up `ci-backend.yml` and the three `ci-*-app.yml` workflows as soon as each app has its first real code — catch style/type/test issues early, not in a pile at the end.
2. Provision real cloud infra now, via Terraform (`infra/terraform/environments/pilot.tfvars`): actual Supabase project, actual Upstash Redis instance, actual R2 bucket. Up to this point everything ran against local Docker containers — this step moves staging onto the real managed services you'll launch on.
3. Set `.env` values for real: put actual secrets (DB URL, JWT secret, Anthropic key, R2 credentials, Resend key) into GitHub Actions secrets, Render's dashboard, and Vercel's dashboard — never in the repo.
4. Set up `security-scan.yml` (Gitleaks + `npm audit`) at this point too, since real secrets now exist and a leak is a real risk, not a hypothetical one.
5. Set up staging deploy (`develop` branch → Render/Vercel staging) once Phase 3's vertical slice works locally — get it running in a real hosted environment early, since hosting-specific issues (env vars, cold starts, CORS) are much easier to fix with a small app than a fully-featured one.
6. Wire Sentry SDK into the backend and all three frontends now — catching errors from staging onward, not just once the app is "finished."
7. Set up Better Uptime (or equivalent) pinging the staging `/health` endpoint.
8. Set up production deploy gate and `warm-server.yml` closer to pilot launch (Phase 12), pointing at `production.tfvars`.

---

## Phase 11 — Testing pass

1. Write unit tests for the trickiest logic as you build it (adaptive scoring, grading parser, integrity flag rules) — don't defer all testing to the end.
2. Once all 6 features are built (end of Phase 9), do a full manual pass: create a mock exam, invite mock students, run through every feature end-to-end as each role.
3. Run the k6 scripts (`login-load-test.js`, `exam-submission-burst-test.js`, `autosave-load-test.js`) against staging at the concurrency level your actual pilot school needs.

---

## Phase 12 — Pilot launch

1. Do one backup/restore drill — take a manual database snapshot, restore it to a scratch environment, confirm it actually works, per Section 10 of the Operations Guide. An untested backup is not a backup.
2. Run through the pre-exam checklist from the Operations Guide.
3. Do a dry run with a small group (10–20 real or test users) before the first real graded exam.
4. Go live with the actual pilot school, with monitoring (Sentry + uptime) active and someone watching the teacher monitor dashboard during the live exam window.
5. After the pilot exam, review Sentry/logs for anything that didn't show up in testing, and feed it back into the backlog.

---

## Summary: build order at a glance

```
-1. Accounts & local env → cloud accounts, Docker, dependencies installed, local boot works
0.  Foundation           → schema, shared types, health check, auth, roles, permissions doc
1.  Admin app            → shared UI components, invite teachers & students
2.  Teacher app          → file uploads, create exams & questions
3.  Student app          → CORE: take exam, submit, get raw score   ← most important milestone
4.  Topic weakness report
5.  Behavioral analytics + anti-cheating
6.  Teacher live/polling monitor
7.  AI-assisted grading
8.  Adaptive difficulty
9.  Admin logs (parallel with 4–8)
10. CI/CD, real infra provisioning, secrets, Sentry, uptime monitoring (start during phase 3, not after)
11. Full testing + load testing
12. Backup/restore drill + pilot launch
```

## The one rule that matters most
**Don't start Phase 4 until Phase 3's test checkpoint genuinely passes end-to-end.** Every feature after Phase 3 builds on top of a working core exam flow — building analytics, grading, or adaptive logic against a shaky or half-working submission flow means every bug you hit afterward is ambiguous (is it the new feature, or the foundation underneath it?). Get the plain, boring, unglamorous "student takes exam and gets a score" flow rock solid first.
