# Exam Platform — Permissions Matrix (Role × Action)

This document defines the definitive access control policy for the Exam Platform across all three user roles: **ADMIN**, **TEACHER**, and **STUDENT**. All backend guards (`RolesGuard`, `OwnershipGuard`, `JwtAuthGuard`) must strictly adhere to this matrix.

---

## Role Definitions

| Role | Description |
|---|---|
| **ADMIN** | Platform administrator responsible for user account provisioning (inviting teachers/students), managing account status (activate/deactivate), and inspecting system audit logs & security flags. |
| **TEACHER** | Educator responsible for creating and organizing topics, building question banks, scheduling exams, monitoring live student attempts, reviewing AI grading suggestions, and publishing final scores. |
| **STUDENT** | Candidate taking assigned exams, autosaving in-progress answers, submitting attempts, and viewing performance reports & weakness analyses. |

---

## Role × Action Matrix

| Module / Domain | Action / Endpoint | ADMIN | TEACHER | STUDENT | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|---|
| **Auth** | Login (`POST /api/auth/login`) | ✅ | ✅ | ✅ | Public |
| | Get Current Profile (`GET /api/auth/me`) | ✅ | ✅ | ✅ | `JwtAuthGuard` |
| **Invites** | Create User Invite (`POST /api/invites`) | ✅ | ❌ | ❌ | `JwtAuthGuard` + `@Roles('ADMIN')` |
| | Validate Token (`GET /api/invites/validate/:token`) | ✅ | ✅ | ✅ | Public |
| | Redeem Invite & Set Password (`POST /api/invites/redeem`) | ✅ | ✅ | ✅ | Public |
| **Users** | List Users (`GET /api/users`) | ✅ | ❌ | ❌ | `JwtAuthGuard` + `@Roles('ADMIN')` |
| | Deactivate/Reactivate User (`PATCH /api/users/:id/status`) | ✅ | ❌ | ❌ | `JwtAuthGuard` + `@Roles('ADMIN')` |
| **Topics** | Create / Update / Delete Topics | ❌ | ✅ | ❌ | `JwtAuthGuard` + `@Roles('TEACHER')` |
| | List Topics | ✅ | ✅ | ✅ | `JwtAuthGuard` |
| **Exams** | Create Exam (`POST /api/exams`) | ❌ | ✅ | ❌ | `JwtAuthGuard` + `@Roles('TEACHER')` |
| | Edit Exam (`PATCH /api/exams/:id`) | ❌ | ✅ (Owner) | ❌ | `JwtAuthGuard` + `OwnershipGuard` |
| | Delete Exam (`DELETE /api/exams/:id`) | ❌ | ✅ (Owner) | ❌ | `JwtAuthGuard` + `OwnershipGuard` |
| | List Available Exams (`GET /api/exams`) | ✅ | ✅ (Own) | ✅ (Published) | Filtered in query |
| **Questions** | Add / Edit Questions | ❌ | ✅ (Owner) | ❌ | `OwnershipGuard` on Exam |
| | Bulk CSV Upload | ❌ | ✅ | ❌ | `JwtAuthGuard` + `@Roles('TEACHER')` |
| **Attempts** | Start Exam Attempt (`POST /api/attempts/start`) | ❌ | ❌ | ✅ | `JwtAuthGuard` + `@Roles('STUDENT')` |
| | Autosave Answer (`POST /api/attempts/save-answer`) | ❌ | ❌ | ✅ (Owner) | `JwtAuthGuard` + Student Check |
| | Submit Exam (`POST /api/attempts/submit`) | ❌ | ❌ | ✅ (Owner) | `JwtAuthGuard` + Student Check |
| | View Results (`GET /api/attempts/:id/result`) | ✅ | ✅ (Exam Owner) | ✅ (Attempt Owner) | Ownership check |
| **Integrity** | Record Tab Switch / Integrity Flag | ❌ | ❌ | ✅ (Self) | Automated via exam hook |
| | View Integrity Alerts | ✅ | ✅ (Exam Owner) | ❌ | `Roles('ADMIN', 'TEACHER')` |
| **Audit Logs** | View Platform Audit Logs (`GET /api/admin/logs`) | ✅ | ❌ | ❌ | `JwtAuthGuard` + `@Roles('ADMIN')` |

---

## Ownership Rules
* **Exams & Questions**: A Teacher can only modify, publish, or delete exams where `exam.teacherId == req.user.id`.
* **Attempts & Answers**: A Student can only submit answers to an attempt where `attempt.studentId == req.user.id`.
* **Results**: A Student can only view their own score and weakness report. A Teacher can view attempts across their own exams.
