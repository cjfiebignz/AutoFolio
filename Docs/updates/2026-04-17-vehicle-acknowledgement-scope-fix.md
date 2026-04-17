# AutoFolio Update - 2026-04-17
## Title
Vehicle Overview Maintenance Acknowledgement Scope Fix

## Summary
Fixed a frontend state isolation bug where acknowledging the maintenance overview on one vehicle could incorrectly affect another vehicle.

## Why
The acknowledgement state was not fully scoped per vehicle, causing cross-vehicle refresh behavior and reducing trust in the maintenance panel UX.

## Changes
- Scoped acknowledgement persistence by vehicleId
- Preserved session-based dismissal behavior
- Re-showed panel only when that vehicle’s maintenance state changes
- Kept all existing UI styling and interaction patterns unchanged

## Backend Impact
- None
- No schema changes
- No endpoint changes
- No contract changes

## Frontend Impact
- Updated VehicleOverviewDisplay acknowledgement persistence logic
- Hardened sessionStorage handling

## Files Modified
- src/components/vehicles/VehicleOverviewDisplay.tsx

## Patterns Introduced
- Vehicle-scoped session persistence for dismissible overview panels

## Validation
- Vehicle A acknowledgement no longer affects Vehicle B
- Panel reappears only on same-vehicle status change
- Session reset restores panel as expected

## Follow-up
- Consider extracting reusable per-entity dismissal persistence utility if this pattern appears elsewhere
