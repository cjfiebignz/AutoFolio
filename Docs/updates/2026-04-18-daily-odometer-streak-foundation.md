# Daily Odometer Streak Foundation

**Date:** 2026-04-18  
**Agent:** Gemini A (Backend Specialist)

## Overview
Implemented the backend intelligence layer for tracking **Odometer Update Streaks** and providing real-time odometer references for the user's **Daily Vehicle**. This foundation enables Garage-level gamification and simplifies the "Quick Update" workflow by providing accurate current mileage data.

## Changes
### 1. Streak Logic & Usage Metrics
- **Usage Day:** Defined as any UTC calendar day where at least one `OdometerReading` is recorded for the current Daily Vehicle.
- **"Through Yesterday" Rule:** The streak increments for each consecutive day of activity. It remains "alive" if the most recent update occurred either **Today** or **Yesterday**, allowing for a 1-day grace period before reset.
- **Service Layer Implementation:** Added `getDailyStreak(userId)` to `UserVehicleService`, which computes:
  - `currentStreak`: Consecutive active days.
  - `updatedToday`: Boolean status for the current day.
  - `currentOdometerKms`: The authoritative current mileage using the app-wide `calculateServiceSummary` source of truth.
  - `lastUpdatedAt`: Absolute timestamp of the latest log.

### 2. API Endpoints
- Added `GET /user-vehicles/daily/streak?userId=...` for dedicated streak and odometer reference fetching.
- Refactored `GET /user-vehicles/daily/usage-summary?userId=...` to use standard query parameters and include the new odometer reference.

## Why
By centralizing odometer and streak intelligence in the backend, we ensure that the "Quick Update" modal always has access to the canonical mileage source of truth (merging manual and service-based logs). This prevents the "Not recorded" data mismatch and provides a stable basis for future telemetry integration.

## Validation
- **Odometer Sync:** Verified that `getDailyStreak` returns the same `currentKms` shown in vehicle detail and list views.
- **Streak Continuity:** Confirmed that logging an odometer reading today correctly increments the streak from yesterday.
- **Graceful Nulls:** Confirmed that users with no daily vehicle or no history receive a clean response with `currentOdometerKms: null`.

## Notes
- The "Quick Update" modal can now reliably display "Recorded Odometer" using the `currentOdometerKms` field from this endpoint.
- Reuses the robust `calculateServiceSummary` method to ensure perfect consistency with the rest of the application.
