# AutoFolio MVP Schema Notes

## Goal
Define the minimum clean structure required to support:
- user vehicles
- service history
- reminders
- registration and insurance tracking
- future linking to SpecHUB through specID

## Early candidate entities
- User
- UserVehicle
- ServiceEvent
- PartUsage
- Reminder
- RegistrationRecord
- InsuranceRecord
- Document
- Workshop (future-compatible)
- CustomerLink (future)

## Reminders
- keep MVP practical
- avoid pulling too much workshop functionality into first release
- keep ownership data clearly separate from reference data
