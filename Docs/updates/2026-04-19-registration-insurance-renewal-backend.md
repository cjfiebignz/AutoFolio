# Registration and Insurance Renewal Flow - Backend Foundation

**Date:** 2026-04-19  
**Agent:** Gemini A

## Overview
Implemented the backend foundation for the Registration and Insurance renewal flows. This includes new API endpoints for quick renewals, updated financial aggregation logic, and data structures to support historical tracking of renewals.

## Changes

### 1. Data Model & Financials
- **Lifetime Cost Tracking:** Updated `getVehicleFinancials` in `UserVehicleService` to include costs from all registration and insurance records. Total vehicle investment now authoritative across Services, Work Jobs, Registration, and Insurance.
- **Audit Preservation:** Renewal logic is designed to create a new historical record instead of overwriting the previous one, ensuring a clean audit trail of policy/registration periods and their respective costs.

### 2. Service Logic (Renewal Flow)
- **Automatic Deactivation:** The system now automatically deactivates previous "Current" records and cleans up their auto-reminders when a renewal or new active record is created.
- **Contextual Cloning:** Quick-renewal endpoints clone the static provider/identity data from the existing record to minimize data entry for "Same Provider" renewals.

### 3. New API Endpoints
- `POST /user-vehicles/:id/registrations/:regId/renew`: Creates a new registration period based on an existing record with updated expiry and cost.
- `POST /user-vehicles/:id/insurance/:insId/renew`: Creates a new insurance policy period based on an existing record with updated expiry and premium.

### 4. DTOs
- `RenewRegistrationDto`: Captures `expiryDate`, `cost`, `notes`, and optional `registrationStartDate`.
- `RenewInsuranceDto`: Captures `expiryDate`, `premiumAmount`, `notes`, and optional `policyStartDate`.

## Verification
- [x] Lifetime cost summary correctly aggregates Registration and Insurance totals.
- [x] Renewal flow deactivates previous active records.
- [x] Renewal flow creates new auto-reminders for the next expiry.
- [x] Case B (New Provider) is supported by existing creation flows which also trigger deactivation of old current records.
