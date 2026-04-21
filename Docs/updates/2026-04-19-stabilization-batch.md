# Stabilization and Polish Batch

**Date:** 2026-04-19  
**Agent:** Gemini A / Gemini B

## Overview
This batch focused on critical stabilization, mobile asset recovery, and UI polish following the major Garage streak and odometer system updates. It resolves several regression points including mobile image loading failures, preferences fetch errors (500), and hydration mismatches.

## Changes

### 1. Mobile Image & Hydration Stabilization
- **Asset Normalization:** Implemented a hydration-safe `normalizeImageUrl` utility that intelligently switches between absolute URLs (server-side) and proxied relative paths (client-side).
- **Mobile Proxying:** Configured Next.js rewrites to proxy `/uploads` and `/api-proxy` requests, ensuring mobile devices can reach the backend without `localhost` leakage.
- **Hydration Safety:** Added `suppressHydrationWarning` to the root layout to handle non-app attributes (e.g., from browser extensions) that were causing noise.

### 2. Service Status Card Polish
- **Layout Refinement:** Rebuilt the top section of the `VehicleServiceSummaryCard` with a multi-row architecture to ensure authoritative metrics like "Current Odometer" and "Next Due At" are visually balanced and mobile-responsive.
- **Hierarchy:** Moved the maintenance status pill below the primary heading for better information flow.
- **Interactions:** Standardized action button placement and hover states for a more premium feel.

### 3. Preferences System Recovery (500 Fix)
- **Schema Alignment:** Updated the backend `User` model to include the `measurementSystem` field, syncing it with the new frontend preference contract.
- **Adapter Hardening:** Corrected the `PrismaPg` adapter initialization in `PrismaService` to use a connection pool (`pg.Pool`), resolving the underlying database connectivity issues.
- **API Synchronization:** Updated the frontend API client and backend DTOs to fully support the `measurementSystem` (Metric/Imperial) preference.

## Architectural Notes
- **Prisma Connection Strategy:** Shifted to explicit `pg.Pool` management for the PostgreSQL adapter to improve stability in the NestJS environment.
- **Asset Path Policy:** Moved to a proxy-first approach for development to ensure consistency across local and mobile testing environments.

## Verification
- Mobile images load reliably via the Next.js proxy.
- Preferences page and PlanProvider fetch data without 500 errors.
- Service Status card is visually stable across different screen sizes.
- Hydro mismatch warnings are minimized.
