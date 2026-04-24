# Update: Repo Integrity, Cleanup, and Stability (2026-04-24)

This update focuses on resolving several UI crashes, improving form validation, polishing the calendar experience, and ensuring cross-platform image stability.

### Work & Documentation Fixes
- **Work Form:** Fixed a crash caused by undefined `useRef` and implemented a fetch guard to prevent redundant vehicle metadata requests.
- **Document Form:** Resolved confusing date validation warnings and ensured the required date field is correctly handled during save.

### Vehicle Specifications (Specs)
- **Accordion Navigation:** Categories now collapse on entry by default.
- **Architecture:** Extracted interactive accordion state into a client component to resolve Server Component build errors.
- **Export Flow:** Replaced the browser print fallback with a real backend-generated PDF export for technical reference lists.

### Calendar & Registration
- **Calendar Polish:** Hidden the agenda sidebar in both Vehicle and Garage calendars until a day is selected for a cleaner mobile/desktop experience.
- **Registration Form:** Removed the redundant SpecHUB ID section and fixed a submission crash related to `rawData` scoping.

### Frontend Stability & Cleanup
- **Image Reliability:** Implemented `onLoad` opacity transitions for vehicle banners and cards to ensure smooth visual entry.
- **Hydration Safety:** Updated `image-utils` and `next.config.ts` to use relative proxy paths for uploads, ensuring server/client hydration matches and improving mobile reliability.
- **Fetch Optimization:** Reduced duplicate fetches for Daily streaks and Specs metadata.
- **Debug Noise:** Removed stale `PlanContext` console logging.

### Backend Refinements
- **Preference Sync:** Added support for `measurementSystem` (metric/imperial) synchronization.
- **Database Stability:** Switched to a pooled connection architecture in `PrismaService` for better long-term reliability.
