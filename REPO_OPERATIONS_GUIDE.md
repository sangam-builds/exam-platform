# Exam Platform — Repo Management & Operations Guide

This document defines how code moves from a developer's machine to production, and how the platform is kept healthy once it's live. Hand this to any engineer or agent working on the repo — it should answer "what do I do" at every stage without needing to ask.

---

## 1. Branching strategy

```
main            → always deployable, mirrors production
develop         → integration branch, mirrors staging
feature/*       → new features, branched from develop
fix/*           → bug fixes, branched from develop
hotfix/*        → urgent production fixes, branched from main
release/*       → optional, for batching multiple features before a release
```

**Rules**
- Nobody commits directly to `main` or `develop` — every change goes through a pull request.
- Branch names include a ticket/issue reference where possible: `feature/EXAM-42-adaptive-difficulty`.
- `hotfix/*` branches merge into **both** `main` and `develop` immediately, so the fix isn't lost on the next release.
- Delete branches after merge — keep the branch list to what's actively in progress.

---

## 2. Commit conventions

Use **Conventional Commits** so changelogs and version bumps can be automated later:

```
feat: add adaptive difficulty scoring service
fix: prevent duplicate submission on double-click
chore: bump prisma to 5.10
docs: update PERMISSIONS.md with teacher ownership rules
refactor: extract grading logic into separate service
test: add e2e test for exam submission flow
```

**Rules**
- One logical change per commit. Don't bundle an unrelated refactor with a feature.
- Never commit `.env` files, API keys, or credentials — see Section 8 (Secrets).
- Squash-merge feature branches into `develop` so `main`/`develop` history stays readable.

---

## 3. Pull request process

Every PR must:
1. Target `develop` (or `main` only for hotfixes).
2. Pass all CI checks (Section 4) before it's mergeable — no manual override.
3. Have at least one reviewer approval (even if it's a second agent/pass, not just self-merge).
4. Include a short description of **what changed** and **why**, plus which app(s) it touches (backend / student-app / teacher-app / admin-app).
5. Link the relevant doc if it changes behavior covered in `PERMISSIONS.md`, `DATABASE_SCHEMA.md`, or `API.md` — update the doc in the same PR, not "later."

**PR template checklist** (put this in `.github/PULL_REQUEST_TEMPLATE.md`):
```
- [ ] Tests added/updated for this change
- [ ] Ran locally against docker-compose without errors
- [ ] No secrets or .env values committed
- [ ] Relevant docs updated (PERMISSIONS.md / API.md / DATABASE_SCHEMA.md)
- [ ] If this touches DB schema: migration file included
```

---

## 4. CI pipeline (what runs automatically on every PR)

| Stage | Tool | Fails the build if... |
|---|---|---|
| Lint | ESLint + Prettier | Code style violations |
| Type check | `tsc --noEmit` | Type errors |
| Unit tests | Jest | Any test fails |
| Build | `next build` / `nest build` | Build errors |
| Security scan | Gitleaks + `npm audit` | Secrets detected or high-severity vulnerabilities |
| E2E tests (backend) | Supertest | API contract broken |

CI runs **per-app** — a change to `student-app` doesn't rebuild/retest `admin-app`, keeping feedback fast. Turborepo's caching skips unchanged apps entirely.

**Rule: no PR merges with a red CI check.** Not "we'll fix it after," not "it's just a flaky test" — rerun it, and if it's genuinely flaky, fix the flakiness in a separate PR before merging anything else on top of it.

---

## 5. CD pipeline (what happens after merge)

```
merge to develop  → auto-deploy to STAGING
merge to main     → auto-deploy to PRODUCTION (with manual approval gate)
```

**Staging deploy (automatic)**
- Runs on every merge to `develop`.
- Deploys backend to a staging Render service, frontends to staging Vercel deployments.
- Runs database migrations against the staging DB automatically.
- Posts a comment on the PR with the staging URL for manual spot-checking.

**Production deploy (gated)**
- Triggered on merge to `main`.
- Requires a manual "Approve" click in GitHub Actions (Environments → production → required reviewers) — this is the one deliberate human/agent-in-the-loop checkpoint before anything touches real students' data.
- Steps, in order:
  1. Run full test suite again against `main` (belt and suspenders).
  2. Run database migrations against production DB — **never** run migrations manually outside this pipeline.
  3. Deploy backend (Docker image build → push → Render production service).
  4. Deploy all three frontends to production Vercel projects.
  5. Hit `/health` on the new backend deploy — if it doesn't return 200 within 30s, **auto-rollback** to the previous deploy.
  6. Post deploy summary to a Slack/Discord webhook (or email) with what changed and who approved it.

**Rule: never deploy directly to production outside this pipeline.** No manual `git push` to a server, no manual file edits on Render. If it didn't go through the pipeline, it isn't trusted.

---

## 6. Environment & secrets management

- Each app has its own `.env.example` committed to the repo — this is the source of truth for **what** variables exist, never their real values.
- Real secrets live in:
  - **GitHub Actions**: repository secrets (Settings → Secrets and variables → Actions)
  - **Render**: environment variables set in the Render dashboard per service
  - **Vercel**: environment variables set per project, scoped to Production/Preview/Development separately
- **Never** commit a real `.env` file. `.gitignore` at the root already excludes `.env`, `.env.local`, `.env.*.local` — don't override this.
- Rotate the `JWT_SECRET`, database password, and Anthropic API key immediately if any of them are ever accidentally exposed (pushed commit, screenshot, log output) — don't wait to see if it's exploited.

---

## 7. Database migrations

- All schema changes go through **Prisma migrations** — never edit the production database schema by hand.
- Workflow:
  1. Change `schema.prisma` locally.
  2. Run `npx prisma migrate dev --name describe_the_change` — this generates a migration file and applies it locally.
  3. Commit the generated migration file in `prisma/migrations/` along with your PR.
  4. CI/CD applies it automatically to staging (on merge to `develop`) and production (on merge to `main`, during the gated deploy).
- **Never** use `prisma db push` against staging or production — that bypasses migration history and makes rollback impossible.
- Before any migration that **drops or renames** a column, take a manual database snapshot first (see Section 10, Backups) — even though most managed Postgres providers auto-backup, this is a zero-cost extra safety step for irreversible changes.

---

## 8. Monitoring & alerting

| What | Tool | Alert threshold |
|---|---|---|
| Error tracking | Sentry (backend + all 3 frontends) | Any new error type → Slack/email notification |
| Uptime | Better Uptime (free tier) pinging `/health` | Down for 2+ consecutive checks → immediate alert |
| Server logs | Render's built-in logs (upgrade to Grafana Loki post-pilot) | Manual review during/after exam windows |
| Database health | Supabase dashboard (connection count, query performance) | Manual check before exams above ~150 concurrent |
| Redis usage | Upstash dashboard (command count vs daily quota) | Set a manual reminder to check before large exams |

**Rule:** Sentry and uptime monitoring are non-negotiable from day one — they're free and they're the difference between finding out about a problem from a dashboard vs. from an angry teacher.

---

## 9. Pre-exam checklist (run before every real exam, not just once)

This is the operational safeguard for the "don't let it break during a real exam" goal:

1. Confirm expected concurrent student count for this specific exam.
2. If count is meaningfully higher than a prior tested run, run a k6 load test against staging first (`infra/k6/exam-submission-burst-test.js`).
3. Trigger `warm-server.yml` (or manually hit `/health`) 10–15 minutes before the exam start time, so the backend isn't cold-starting when the first student logs in.
4. Confirm Upstash command usage is well under the daily quota for the day so far.
5. Confirm Supabase connection count is at baseline (not already elevated from other activity).
6. Have the teacher's monitor dashboard open in a browser tab during the exam window, so problems are visible in real time rather than discovered after.
7. If anything looks abnormal (slow responses, error rate ticking up on Sentry), follow Section 11 (Incident response) immediately — don't wait to see if it resolves itself.

---

## 10. Backups & disaster recovery

- **Database**: rely on the managed provider's automatic backups (Supabase/RDS both do daily backups on paid tiers; free tier has more limited retention — confirm current retention window in the provider dashboard before assuming it exists).
- **Before risky migrations**: take a manual snapshot regardless of tier (Section 7).
- **Recovery drill**: periodically (e.g. monthly during active development) actually practice restoring a backup to a scratch environment — an untested backup is not a backup.
- **File storage (R2/S3)**: versioning can be enabled on the bucket if question images/files are ever overwritten by mistake — cheap insurance, worth turning on.

---

## 11. Incident response (when something breaks)

1. **Acknowledge** — whoever sees the alert (Sentry/uptime/manual report) confirms they're on it, so effort isn't duplicated.
2. **Assess severity**:
   - *Critical*: students actively unable to take/submit an exam right now → drop everything.
   - *Degraded*: slow but functional → fix with normal urgency.
   - *Cosmetic*: UI bug with no functional impact → normal backlog.
3. **For critical issues during a live exam**:
   - Check `/health` and Render dashboard first — is the backend up at all?
   - Check Sentry for the specific error spiking.
   - If it's a bad deploy: **roll back immediately** — don't debug in production while students wait. Redeploy the previous known-good version (Render/Vercel both keep prior deploys one click away).
   - Communicate to the teacher/admin what's happening in plain terms — silence is worse than "we're aware, fixing now."
4. **After resolution**: write a short incident note in `docs/RUNBOOK.md` — what broke, why, what fixed it, what would prevent it next time. This turns every incident into a permanent improvement instead of a repeat.

---

## 12. Release/versioning

- Tag production releases: `v1.0.0`, `v1.1.0`, etc., following semantic versioning — major for breaking changes, minor for new features, patch for fixes.
- Auto-generate a changelog from Conventional Commit messages (e.g. via `conventional-changelog` or GitHub's auto-generated release notes) so there's always a human-readable record of what shipped when.

---

## Summary: the one-sentence version of each section
1. Branch through PRs, never commit to `main`/`develop` directly.
2. Use Conventional Commits.
3. Every PR reviewed and CI-green before merge.
4. CI lints, type-checks, tests, builds, and scans every PR automatically.
5. `develop` auto-deploys to staging; `main` deploys to production only with manual approval and health-check verification.
6. Secrets live in CI/host dashboards, never in the repo.
7. Schema changes only through committed Prisma migrations.
8. Sentry + uptime monitoring running from day one.
9. Warm the server and check quotas before every real exam.
10. Backups exist and are periodically tested.
11. Known incident response steps, with rollback as the default first move, not last resort.
12. Tagged, versioned releases with a real changelog.
