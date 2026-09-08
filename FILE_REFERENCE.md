# Exam Platform — File-by-File Reference

This document explains what every file in the repo structure does. Use it as the map when navigating the codebase or briefing anyone (human or agent) new to the project.

---

## Root level

| File | Purpose |
|---|---|
| `.env.example` | Lists all root-level environment variable names (no real values) — the template for setting up `.env` |
| `.gitignore` | Excludes `.env`, `node_modules`, build output, etc. from version control |
| `.eslintrc.js` | Root ESLint rules shared/extended by all apps for consistent code style |
| `.prettierrc` | Formatting rules (indentation, quotes, semicolons) applied across the whole repo |
| `turbo.json` | Turborepo pipeline config — defines how `build`, `test`, `lint` tasks run and cache across apps/packages |
| `package.json` | Root workspace definition — lists `apps/*` and `packages/*` as npm workspaces, holds shared dev tooling |
| `tsconfig.base.json` | Shared TypeScript compiler settings that each app/package extends |
| `README.md` | Entry point for anyone opening the repo — what the project is, how to run it locally |

---

## `.github/workflows/` — CI/CD pipelines

| File | Purpose |
|---|---|
| `ci-backend.yml` | On every PR touching `apps/backend`: lints, type-checks, runs unit + e2e tests, builds the NestJS app |
| `ci-student-app.yml` | Same checks, scoped to the student frontend |
| `ci-teacher-app.yml` | Same checks, scoped to the teacher frontend |
| `ci-admin-app.yml` | Same checks, scoped to the admin frontend |
| `deploy-backend.yml` | On merge to `main`: builds the Docker image, pushes it, runs DB migrations, deploys to Render, health-checks the new deploy |
| `deploy-student-app.yml` | Deploys the student app to its Vercel project on merge to `main` |
| `deploy-teacher-app.yml` | Deploys the teacher app to its Vercel project on merge to `main` |
| `deploy-admin-app.yml` | Deploys the admin app to its Vercel project on merge to `main` |
| `warm-server.yml` | Scheduled workflow that pings the backend's `/health` endpoint before known exam windows, preventing cold-start delays on free-tier hosting |
| `load-test.yml` | Manually triggered (or scheduled) workflow that runs the k6 scripts against staging and reports results |
| `security-scan.yml` | Runs Gitleaks (secret scanning) and `npm audit` (dependency vulnerabilities) on a schedule and on every PR |

---

## `apps/backend/` — NestJS API

### Top-level
| File | Purpose |
|---|---|
| `src/main.ts` | Application entry point — bootstraps the NestJS app, sets global pipes/filters, starts the HTTP server |
| `src/app.module.ts` | Root module — imports every feature module (auth, exams, questions, etc.) into the application |
| `.env.example` | Template listing backend-specific env vars: DB URL, JWT secret, Redis URL, Anthropic API key, R2 credentials |
| `Dockerfile` | Instructions to build the backend into a production container image |
| `.dockerignore` | Excludes `node_modules`, `.env`, test files, etc. from the Docker build context |
| `nest-cli.json` | NestJS CLI configuration (source root, compiler options) |
| `tsconfig.json` | Backend-specific TypeScript config, extends `tsconfig.base.json` |
| `package.json` | Backend dependencies and npm scripts (`start`, `build`, `test`, `migrate`) |

### `src/auth/` — authentication
| File | Purpose |
|---|---|
| `auth.module.ts` | Wires together the auth controller, service, strategies, and guards |
| `auth.controller.ts` | Exposes login/logout/refresh-token HTTP endpoints |
| `auth.service.ts` | Verifies credentials, issues JWTs, handles password hashing checks |
| `guards/jwt-auth.guard.ts` | Blocks requests without a valid JWT |
| `guards/roles.guard.ts` | Checks the authenticated user's role (student/teacher/admin) against what a route requires |
| `decorators/roles.decorator.ts` | Custom decorator (`@Roles('teacher')`) used on controllers to declare required roles |
| `strategies/jwt.strategy.ts` | Passport strategy defining how a JWT is validated and decoded into a user object |

### `src/permissions/` — fine-grained rights
| File | Purpose |
|---|---|
| `permissions.module.ts` | Registers the permissions system with the app |
| `permissions.enum.ts` | Enumerates specific actions (`CREATE_EXAM`, `DELETE_ANY_USER`, `VIEW_ALL_LOGS`) referenced by guards |
| `ownership.guard.ts` | Checks not just role but *ownership* — e.g. confirms a teacher editing an exam actually created that exam |

### `src/invites/` — account provisioning
| File | Purpose |
|---|---|
| `invites.module.ts` | Registers the invite flow |
| `invites.controller.ts` | Endpoint admin calls to issue an invite (creates a pending account, sends an email) |
| `invites.service.ts` | Generates invite tokens, sends the invite email, validates token redemption when a user sets their password |
| `entities/invite.entity.ts` | Database model for a pending invite (email, role, token, expiry, used status) |

### `src/uploads/` — file handling
| File | Purpose |
|---|---|
| `uploads.module.ts` | Registers upload handling |
| `uploads.controller.ts` | Endpoints for uploading question images and bulk CSV files |
| `uploads.service.ts` | Validates file type/size, parses CSVs, pushes files to Cloudflare R2/S3 |

### `src/health/`
| File | Purpose |
|---|---|
| `health.controller.ts` | Exposes `GET /health` — used by `warm-server.yml`, uptime monitoring, and the deploy pipeline's post-deploy check |

### `src/users/`
| File | Purpose |
|---|---|
| `users.module.ts` | Registers user CRUD |
| `users.controller.ts` | Endpoints to create/read/update/deactivate user accounts (used by admin app) |
| `users.service.ts` | Business logic for user management |
| `entities/user.entity.ts` | Database model: id, email, role, password hash, status |

### `src/exams/`
| File | Purpose |
|---|---|
| `exams.module.ts` | Registers exam management |
| `exams.controller.ts` | Endpoints to create/edit/list/delete exams |
| `exams.service.ts` | Business logic — enforces exam scheduling, ownership rules |
| `entities/exam.entity.ts` | Database model: title, duration, start/end time, owning teacher, linked questions |

### `src/questions/`
| File | Purpose |
|---|---|
| `questions.module.ts` | Registers question bank management |
| `questions.controller.ts` | Endpoints to create/edit/list questions, including bulk import |
| `questions.service.ts` | Business logic for question CRUD and topic/difficulty tagging |
| `entities/question.entity.ts` | Database model: text, options, correct answer, topic, difficulty level |
| `dto/create-question.dto.ts` | Validation schema for the shape of a new question request |

### `src/attempts/`
| File | Purpose |
|---|---|
| `attempts.module.ts` | Registers exam-attempt tracking |
| `attempts.controller.ts` | Endpoints students hit to start an attempt, autosave answers, and submit |
| `attempts.service.ts` | Business logic — enforces one attempt per student per exam, calculates final score |
| `entities/attempt.entity.ts` | Database model: student, exam, start/submit time, status, score |
| `entities/answer.entity.ts` | Database model: individual answer per question, including time spent and answer-change count (feeds behavioral analytics) |

### `src/adaptive/` — Feature 1
| File | Purpose |
|---|---|
| `adaptive.module.ts` | Registers the adaptive difficulty engine |
| `adaptive.service.ts` | Chooses the next question's difficulty based on the student's running performance during the exam |

### `src/analytics/` — Features 2 & 3
| File | Purpose |
|---|---|
| `analytics.module.ts` | Registers analytics endpoints |
| `analytics.controller.ts` | Endpoints returning topic-wise breakdowns and behavioral metrics for a completed attempt |
| `analytics.service.ts` | Computes per-topic accuracy, time-per-question patterns, and flags anomalies (fast-wrong, slow-right, answer-flipping) |

### `src/grading/` — Feature 4
| File | Purpose |
|---|---|
| `grading.module.ts` | Registers AI-assisted grading |
| `grading.controller.ts` | Endpoint that triggers grading for a subjective answer and returns/stores the AI's suggested score |
| `grading.service.ts` | Sends the student's answer + teacher's rubric to Claude, parses the response, stores a provisional grade for teacher review |
| `anthropic.client.ts` | Thin wrapper around the Anthropic SDK — handles API key, model selection, retries |

### `src/integrity/` — Feature 5
| File | Purpose |
|---|---|
| `integrity.module.ts` | Registers anti-cheating logic |
| `integrity.service.ts` | Shuffles question/option order per student, evaluates tab-switch events, flags suspiciously similar wrong-answer patterns across students |
| `entities/flag.entity.ts` | Database model for a recorded integrity flag: student, exam, type of flag, timestamp |

### `src/dashboard/` — Feature 6
| File | Purpose |
|---|---|
| `dashboard.module.ts` | Registers the teacher monitoring dashboard backend |
| `dashboard.controller.ts` | Polling endpoint returning live exam status (who's submitted, who's active, flags) |
| `dashboard.gateway.ts` | WebSocket gateway for real-time push updates (used once infra supports persistent connections beyond free tier) |

### `src/admin/`
| File | Purpose |
|---|---|
| `admin.module.ts` | Registers admin-only functionality |
| `admin.controller.ts` | Endpoints for managing user access and viewing platform-wide logs |
| `admin.service.ts` | Business logic for access control changes and log querying/filtering |
| `entities/audit-log.entity.ts` | Database model recording every significant action (login, exam created, grade overridden, access changed) for the admin log view |

### `src/topics/`
| File | Purpose |
|---|---|
| `topics.module.ts` | Registers topic/subtopic management |
| `topics.controller.ts` | Endpoints to create/list topics used for tagging questions |
| `entities/topic.entity.ts` | Database model: topic name, parent subject, used by both questions and analytics |

### `src/common/` — cross-cutting utilities
| File | Purpose |
|---|---|
| `filters/http-exception.filter.ts` | Catches errors app-wide and formats them into consistent API error responses |
| `interceptors/logging.interceptor.ts` | Logs every request/response for observability |
| `pipes/validation.pipe.ts` | Applies `class-validator` rules to incoming request bodies globally |
| `middleware/request-logger.middleware.ts` | Writes every request to the audit log, feeding the admin "see all logs" feature |

### `src/database/`
| File | Purpose |
|---|---|
| `database.module.ts` | Registers the Prisma client for dependency injection across the app |
| `migrations/` | Auto-generated Prisma migration files — the version history of the database schema |
| `seeds/` | Scripts to populate the database with sample data for local development |

### `src/config/`
| File | Purpose |
|---|---|
| `env.validation.ts` | Validates that all required environment variables are present and correctly typed at startup |
| `configuration.ts` | Centralizes reading of env vars into a typed config object used throughout the app |

### `test/`
| File | Purpose |
|---|---|
| `unit/` | Unit tests for individual services (e.g. adaptive scoring logic, grading parser) |
| `e2e/` | End-to-end tests hitting real API routes against a test database |

### `prisma/`
| File | Purpose |
|---|---|
| `schema.prisma` | The single source of truth for the entire database schema — every entity, field, and relation |

---

## `apps/student-app/` — student exam-taking frontend

| File | Purpose |
|---|---|
| `app/layout.tsx` | Shared page shell (fonts, providers, global styles) wrapping every student page |
| `app/page.tsx` | Landing page, redirects to login or dashboard |
| `app/(auth)/login/page.tsx` | Student login form |
| `app/(auth)/set-password/page.tsx` | Page where a newly invited student sets their password using the invite token |
| `app/dashboard/page.tsx` | Lists exams available/assigned to the logged-in student |
| `app/exam/[examId]/instructions/page.tsx` | Pre-exam instructions and rules screen |
| `app/exam/[examId]/take/page.tsx` | The actual exam-taking interface — questions, timer, answer submission |
| `app/exam/[examId]/result/page.tsx` | Post-submission score and topic-wise weakness report |
| `components/exam/QuestionCard.tsx` | Renders a single question and its answer options |
| `components/exam/Timer.tsx` | Countdown timer component, triggers auto-submit at zero |
| `components/exam/AnswerOptions.tsx` | Renders selectable answer choices and captures selection |
| `components/exam/ProgressBar.tsx` | Shows how many questions are answered vs remaining |
| `components/exam/SubmitConfirmModal.tsx` | Confirmation dialog before final submission |
| `components/result/ScoreSummary.tsx` | Displays overall score after grading |
| `components/result/TopicBreakdownChart.tsx` | Visual chart of per-topic performance (feature 3) |
| `components/common/Header.tsx` | Shared navigation header across student pages |
| `store/examStore.ts` | Zustand store holding in-progress exam state (current answers, current question index) |
| `store/authStore.ts` | Zustand store holding the logged-in student's session info |
| `hooks/useAutosave.ts` | Periodically saves current answers to the backend without user action |
| `hooks/useTabSwitchDetection.ts` | Detects when the student switches tabs/loses focus, reports it for integrity flagging (feature 5) |
| `hooks/useExamTimer.ts` | Manages countdown logic and triggers callbacks at warning/expiry thresholds |
| `lib/apiClient.ts` | Configured Axios/fetch instance for calling the backend, attaches auth token |
| `lib/socket.ts` | Sets up the Socket.io client connection where real-time features are used |
| `types/exam.types.ts` | TypeScript types specific to the student app's exam-taking flow |
| `.env.local.example` | Template for frontend env vars (API base URL, etc.) |
| `tailwind.config.ts` | Tailwind theme/customization for this app |
| `next.config.js` | Next.js build/runtime configuration |
| `package.json` | Student app dependencies and scripts |

---

## `apps/teacher-app/` — teacher upload & monitoring frontend

| File | Purpose |
|---|---|
| `app/layout.tsx` | Shared page shell for teacher pages |
| `app/login/page.tsx` | Teacher login form |
| `app/set-password/page.tsx` | Invite-token password setup page for teachers |
| `app/dashboard/page.tsx` | Lists exams the logged-in teacher has created |
| `app/exams/create/page.tsx` | Form to create a new exam (title, duration, schedule) |
| `app/exams/[examId]/edit/page.tsx` | Edit an existing exam's settings |
| `app/exams/[examId]/questions/page.tsx` | Add/edit/bulk-import questions for a specific exam |
| `app/exams/[examId]/monitor/page.tsx` | Live/polling dashboard showing student progress during the exam (feature 6) |
| `app/grading/[attemptId]/page.tsx` | Screen to review and approve/override AI-suggested grades on subjective answers (feature 4) |
| `app/reports/[examId]/page.tsx` | Class-wide topic performance report after an exam concludes |
| `components/question-editor/QuestionForm.tsx` | Form for creating/editing a single question |
| `components/question-editor/TopicTagSelector.tsx` | UI for tagging a question with a topic/subtopic |
| `components/question-editor/DifficultySelector.tsx` | UI for tagging a question's difficulty level (feeds feature 1) |
| `components/question-editor/BulkUpload.tsx` | CSV/Excel upload interface for adding many questions at once |
| `components/monitor/StudentGrid.tsx` | Grid view showing each student's live status during an exam |
| `components/monitor/IntegrityAlerts.tsx` | Displays flagged tab-switch/cheating alerts in real time |
| `components/monitor/LiveStats.tsx` | Summary stats (submitted count, average time, active count) |
| `components/grading/AIGradeReview.tsx` | UI to view the AI's suggested grade/rationale and accept or override it |
| `components/grading/RubricEditor.tsx` | Lets the teacher define/edit the grading rubric sent to the AI |
| `components/common/Header.tsx` | Shared navigation header across teacher pages |
| `store/examBuilderStore.ts` | Zustand store holding in-progress exam/question creation state |
| `hooks/usePolling.ts` | Handles the 20–30s polling refresh cycle for the monitor dashboard |
| `lib/apiClient.ts` | Configured API client for the teacher app |
| `.env.local.example` | Template for teacher app env vars |
| `next.config.js` | Next.js config for this app |
| `package.json` | Teacher app dependencies and scripts |

---

## `apps/admin-app/` — access control & logs frontend

| File | Purpose |
|---|---|
| `app/layout.tsx` | Shared page shell for admin pages |
| `app/login/page.tsx` | Admin login form |
| `app/dashboard/page.tsx` | Platform-wide overview (total users, exams, recent activity) |
| `app/users/students/page.tsx` | List of all students, with add/remove/deactivate controls |
| `app/users/students/[studentId]/page.tsx` | Individual student's profile and activity history |
| `app/users/teachers/page.tsx` | List of all teachers, with add/remove/deactivate controls |
| `app/users/teachers/[teacherId]/page.tsx` | Individual teacher's profile and activity history |
| `app/logs/page.tsx` | Filterable, searchable log of all platform activity |
| `app/logs/login-history/page.tsx` | Login attempt history across all users |
| `app/logs/integrity-flags/page.tsx` | Cross-exam view of all cheating/integrity flags raised |
| `app/settings/page.tsx` | Platform-wide configuration settings |
| `components/access/UserTable.tsx` | Sortable/filterable table of users |
| `components/access/AddUserModal.tsx` | Form to invite a new student or teacher (calls the invites endpoint) |
| `components/access/BulkImportUsers.tsx` | CSV upload to add many users at once (e.g. a whole class roster) |
| `components/access/RoleAssigner.tsx` | UI to change a user's role |
| `components/logs/LogTable.tsx` | Table rendering of audit log entries |
| `components/logs/LogFilters.tsx` | Filter controls (by user, date range, action type) |
| `components/logs/ExportLogsButton.tsx` | Exports the current filtered log view (e.g. to CSV) |
| `components/common/Header.tsx` | Shared navigation header across admin pages |
| `lib/apiClient.ts` | Configured API client for the admin app |
| `.env.local.example` | Template for admin app env vars |
| `next.config.js` | Next.js config for this app |
| `package.json` | Admin app dependencies and scripts |

---

## `packages/` — shared code across all apps

| File | Purpose |
|---|---|
| `shared-types/src/user.types.ts` | TypeScript types for User objects, shared by backend and all frontends |
| `shared-types/src/exam.types.ts` | TypeScript types for Exam objects |
| `shared-types/src/question.types.ts` | TypeScript types for Question objects |
| `shared-types/src/index.ts` | Re-exports all shared types from one entry point |
| `api-client/src/client.ts` | Base HTTP client configuration reused by all frontends |
| `api-client/src/endpoints/` | Typed functions for calling specific backend endpoints (e.g. `getExam(id)`, `submitAnswer(...)`) |
| `api-client/src/index.ts` | Entry point exporting the configured client and endpoint functions |
| `ui/src/Button.tsx` | Shared button component used across all three frontends for visual consistency |
| `ui/src/Input.tsx` | Shared input field component |
| `ui/src/Modal.tsx` | Shared modal/dialog component |
| `ui/src/index.ts` | Re-exports all shared UI components |

---

## `infra/` — infrastructure as code and operational scripts

| File | Purpose |
|---|---|
| `terraform/main.tf` | Top-level Terraform config tying all infra modules together |
| `terraform/variables.tf` | Declares configurable inputs (region, instance sizes, etc.) |
| `terraform/outputs.tf` | Declares values Terraform exposes after provisioning (e.g. DB connection string) |
| `terraform/modules/database/main.tf` | Provisions the Postgres database (Supabase/RDS) |
| `terraform/modules/redis/main.tf` | Provisions Redis (Upstash/ElastiCache) |
| `terraform/modules/storage/main.tf` | Provisions object storage (R2/S3) |
| `terraform/modules/compute/main.tf` | Provisions backend compute (Render service/ECS) |
| `terraform/environments/pilot.tfvars` | Variable values sized for the free-tier pilot setup |
| `terraform/environments/production.tfvars` | Variable values sized for the future 5k-scale setup |
| `docker/docker-compose.yml` | Spins up backend + Postgres + Redis locally for development |
| `docker/docker-compose.prod.yml` | Production-like compose file for local production testing |
| `docker/nginx/nginx.conf` | Reverse proxy config, used if self-hosting rather than relying purely on managed load balancers |
| `k6/login-load-test.js` | Simulates many concurrent logins to test that bottleneck point |
| `k6/exam-submission-burst-test.js` | Simulates the "everyone submits at once" scenario |
| `k6/autosave-load-test.js` | Simulates sustained autosave traffic during an exam |

---

## `scripts/` — one-off operational scripts

| File | Purpose |
|---|---|
| `setup-dev.sh` | One-command local environment bootstrap (installs deps, starts docker-compose, runs migrations) |
| `seed-db.sh` | Populates the database with sample questions/users for local testing |
| `migrate.sh` | Runs pending Prisma migrations against the target environment |
| `warm-render.sh` | Pings the backend's `/health` endpoint to wake it from a cold start before an exam |

---

## `docs/` — reference documentation

| File | Purpose |
|---|---|
| `ARCHITECTURE.md` | High-level explanation of how the apps, database, and infra fit together |
| `DATABASE_SCHEMA.md` | Human-readable explanation of the schema defined in `schema.prisma` |
| `API.md` | Documents backend endpoints, request/response shapes |
| `DEPLOYMENT.md` | Step-by-step deployment instructions and environment setup |
| `RUNBOOK.md` | Living log of past incidents and how they were resolved |
| `PERMISSIONS.md` | The role × action rights matrix that `roles.guard.ts` and `ownership.guard.ts` implement |

---

## Two files still worth writing next
As flagged earlier, `prisma/schema.prisma` and `docs/PERMISSIONS.md` are referenced throughout this document but not yet written — they're the two foundational files everything else in `apps/backend` depends on.
