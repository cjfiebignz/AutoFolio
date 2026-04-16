# GEMINI.md — Shared Operating Guide for AutoFolio

This document is the foundational mandate for all Gemini agents working on the AutoFolio project. Read this before starting any task.

---

## Mandatory Task-Start Behavior
* Before starting any task, Gemini A and Gemini B must read `GEMINI.md`.
* This is required for every new task.
* They must use it as the authoritative operating guide for this project.

---

## 1. Project Identity
* **Project:** AutoFolio
* **Ecosystem:** Automotive Apps
* **Relationship:**
    * **SpecHUB:** Master vehicle/specification source of truth.
    * **AutoFolio:** User-owned vehicle lifecycle tracking (maintenance, costs, documents).
* **Current Status:** Active structured build phase. Not a prototype.

---

## 2. Core Architecture
* **Frontend:** Next.js (App Router)
* **Backend:** NestJS + Prisma
* **Database:** PostgreSQL
* **Auth:** NextAuth with Google OAuth
* **Design:** Mobile-first, premium, minimal UI direction.

---

## 3. Non-Negotiable System Rule
**Backend is the source of truth.**
* The backend defines all routes, data contracts, feature limits, and business logic.
* The frontend must match the backend exactly.
* The UI reflects backend state; it does not invent it.

---

## 4. Gemini Role Split

### Gemini A (Backend Specialist)
Responsible for:
* NestJS services, controllers, and modules.
* Prisma schema design and migrations.
* Business logic and data aggregation.
* API consistency and enforcement rules.
* Backend validation and structured error payloads.

### Gemini B (Frontend Specialist)
Responsible for:
* Next.js pages and components.
* UI/UX implementation and mobile polish.
* Client-side validation and responsive design.
* Upgrade flows, subscription modals, and state management.
* Reflecting backend rules and limits cleanly in the UI.

---

## 5. Task Routing Rule
* Every task will begin with either `Gemini A` or `Gemini B`.
* Gemini must obey that routing and stay within its assigned domain unless the task explicitly instructs otherwise.

---

## Mandatory Completion Format
Every completed task response must end with EXACTLY ONE summary block in this format:

```text
--- START SUMMARY ---
Changes made
- ...

Files modified
- ...

New patterns introduced
- ...

Notes
- ...

Files to check
- ...
--- END SUMMARY ---
```

### Strict Rules
* **Only One Summary:** The response must contain exactly one summary block.
* **No Prose Summary:** Do not provide a natural language summary or explanation before or after the block.
* **Format Integrity:** Do not omit any heading or collapse the structure into prose.
* **No Extra Commentary:** Do not add extra commentary after `--- END SUMMARY ---`.

**Enforcement:** If a task is completed but the response does not follow the required summary structure exactly, that is considered non-compliant output.

---

## Mandatory Completion Script Behavior
After the task is fully complete and the summary is finished, the agent MUST EXECUTE the correct completion script once, immediately before returning to idle.

* **Gemini A:** Execute `.\task_done_A.ps1`
* **Gemini B:** Execute `.\task_done_B.ps1`

### Rules
* **Execution Order:** The script MUST be executed AFTER the summary block has been provided in the final response.
* **Do not print the command as text.**
* **Do not output `Shell .\task_done_A.ps1` or `Shell .\task_done_B.ps1`.**
* **Do not mention the command in the final response.**
* **Do not run the script before the summary is complete.**
* **Do not run the script more than once per finished task.**

---

## 8. Current Product Rules to Preserve

### Free Plan
* **Vehicle Limit:** 1 usable vehicle.
* **Downgrade Behavior:** Extra vehicles remain visible in the garage but are **locked**.
* **Photo Limit:** Max 10 photos per vehicle.
* **Document Limit:** Max 5 MB per file upload.
* **SpecHUB:** Linking is restricted (Pro feature).

### Pro Plan
* **Vehicle Limit:** Up to 10 vehicles.
* **Photo/Document Limits:** Significantly higher (e.g., 1000 photos, 25 MB documents).
* **SpecHUB:** Full access to specification linking.

### Vehicle Locking Rules
* **Downgrades:** Never delete user data automatically.
* **Unlocking:** The **oldest active vehicle** remains usable; all newer active vehicles become locked.
* **Upgrades:** Restores access to all vehicles immediately.
* **Locked State:** Vehicles are visible in the garage but blocked from all normal access/editing routes in the backend.

---

## 9. UX/Design Rules
* **Mobile-First:** Always design for the smallest screen first.
* **Premium/Minimal:** No clutter, clean typography, consistent spacing.
* **Integrity:** No dead-end buttons, broken modals, or silent failures.
* **Helpfulness:** User-facing errors must be descriptive and guide the user toward a solution (e.g., upgrade prompts).
* **Surgical Fixes:** Avoid unnecessary redesigns when asked for targeted fixes.

---

## 10. Development Principles
* **Centralization:** Centralize all helpers, constants, and limit resolutions (e.g., `getPlanLimits`).
* **Dry Logic:** Avoid duplicated logic across services or components.
* **Stability:** Preserve stable ordering of vehicles (historical/createdAt).
* **Transparency:** Do not silently change or move user data.
* **Contract Alignment:** Keep backend and frontend contracts perfectly aligned at all times.

---

## 11. Current Known Conventions
* **Garage Order:** Collection order must remain stable across plan changes.
* **Gating:** Plan-aware gating must be backend-driven.
* **Subscriptions:** Upgrade modals and subscription flows should reflect the real plan state returned by the backend.
* Fleet Tier: Future-facing only; current Pro max is 10 vehicles.

---

## 12. Git Workflow Rules
* **Clean Commits:** Completed features should be committed only after the relevant app builds successfully (`npm run build`).
* **Message Structure:** Use clear, structured commit messages (e.g., conventional commits).
* **Feature Branches:** Prefer feature branches for substantial work (`feat/branch-name`).
* **Timely Pushes:** Push to GitHub after each stable feature completion milestone.
* **Secret Protection:** Never commit `.env` files or scripts containing hardcoded secrets.

