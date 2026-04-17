# Daily Vehicle System Backend Foundation

**Date:** 2026-04-18  
**Agent:** Gemini A (Backend Specialist)

## Overview
Implemented the backend source-of-truth for the **Daily Vehicle** system. This system ensures that every user has exactly one vehicle designated as their "Daily," which will power future features like maintenance streaks and usage-based insights.

## Changes
### 1. Data Model (Prisma)
- Added `dailyVehicleId` to the `User` model.
- Established a one-to-one relation between `User` and `UserVehicle` (as the daily vehicle).
- Set `onDelete: SetNull` to ensure user records remain valid if their daily vehicle is deleted.

### 2. Vehicle Creation Logic
- Refactored `UserVehicleService.create` to automatically assign the first created vehicle as the "Daily."
- Added support for an explicit `isDaily: true` flag in the creation DTO, which will swap the designation if requested.

### 3. Service Layer Improvements
- Added `setDailyVehicle(userId, vehicleId)` method to handle safe swapping of the daily designation with ownership validation.
- Updated `findAllByUser` and `findOne` to compute and return a derived `isDaily: boolean` field based on the canonical `User.dailyVehicleId`.

### 4. API Endpoints
- Added `POST /user-vehicles/:id/set-daily` to allow users to change their daily vehicle.
- Updated `CreateUserVehicleDto` to accept an optional `isDaily` boolean.

## Why
A "Daily Vehicle" concept provides a focused target for high-frequency interactions (km logging, quick status checks). By enforcing a single source of truth at the user level, we prevent data inconsistencies and provide a stable foundation for the upcoming "Log Streak" gamification system.

## Validation
- First vehicle created for a user is automatically marked `isDaily: true`.
- Subsequent vehicles are `isDaily: false` by default.
- Using the `set-daily` endpoint correctly moves the designation and updates all related responses.
- Responses for `findAllByUser` now include the correct `isDaily` state for every vehicle.

## Notes
- Frontend UI implementation is pending (Badge indicators and toggle logic).
- Existing users without a designated daily vehicle will have their oldest active vehicle automatically assigned as Daily upon their next vehicle fetch or creation.
