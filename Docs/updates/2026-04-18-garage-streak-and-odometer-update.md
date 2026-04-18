# Garage Streak and Odometer Update Flow

**Date:** 2026-04-18
**Type:** Feature / UX / Stability
**Status:** Completed

## Overview
This batch completes the integration of the **Daily Odometer Streak** system into the Garage and expands the **Update Odometer** flow to support all vehicles in the collection. It also includes critical backend stabilization for current-kms derivation and significant improvements to the **AutoFolio Debug Tool**.

## Changes

### 1. Garage Streak Surface
- **Integration:** Integrated the Daily streak display into the `GarageSummaryBar`.
- **States:** Implemented logic to distinguish between "Due Today" (Orange) and "Fulfilled" (Green) states.
- **Efficiency:** Refined streak fetching to reduce duplicate API calls while ensuring data remains fresh after updates.

### 2. Flexible Odometer Update Flow
- **Renaming:** Rebranded "Quick Update" to "Update Odometer" for better clarity.
- **Universal Support:** Expanded the Garage update modal to allow updating the odometer for *any* active vehicle, not just the Daily vehicle.
- **UX Upgrades:**
  - Added a custom, theme-aware vehicle selector.
  - Displayed a "Recorded Odometer" reference for the selected vehicle.
  - Preserved the ability to update odometers even after the Daily streak is fulfilled.
- **Auto-Refresh:** Updating the Daily vehicle immediately refreshes the streak status in the UI.

### 3. Backend Stabilization
- **Authoritative Derivation:** Stabilized `calculateServiceSummary` to reconcile manual updates and service events using `createdAt` tie-breakers for sub-day events.
- **Streak API:** Refined the `/daily/streak` endpoint to return `currentOdometerKms` for immediate frontend use.
- **Robustness:** Added comprehensive null-guards to prevent `TypeError` crashes in the vehicle list and detail paths.

### 4. Debug Tool v1.4
- **Single Output:** Transitioned to human-readable `.txt` logs only (removed `.json`).
- **High-Fidelity Capture:** Upgraded the bridge to capture `fetch` requests (with status/duration), route changes, and console errors.
- **Noise Filtering:** Implemented filtering for Fast Refresh and HMR noise to keep logs actionable.
- **UX:** Added a "Copy Injector" button for one-click bridge activation.

## Technical Details
- **Frontend Components:** Modified `GarageSummaryBar`, `api.ts`, and `autofolio.ts` types.
- **Backend Services:** Updated `UserVehicleService` and `UserVehicleController`.
- **Tooling:** Standalone utility in `/Debug Tool`.

## Verification Results
- Verified that updating a non-Daily vehicle persists the odometer but does not increment the streak.
- Verified that updating the Daily vehicle increments the streak and switches the UI to "Fulfilled".
- Verified that Debug Tool logs are clean, structured, and contain real API/route data.
