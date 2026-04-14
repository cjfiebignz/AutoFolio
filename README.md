# AutoFolio

AutoFolio is a production-focused vehicle lifecycle platform for tracking ownership, maintenance, repairs, upgrades, documents, reminders, and long-term vehicle history.

It is designed to treat the backend as the source of truth, while the frontend delivers a clean, modern, non-blocking user experience. The goal is to create a platform that feels polished, dependable, and genuinely useful for real-world vehicle ownership.

---

## Project Vision

AutoFolio is being built as a professional-grade system for managing everything that happens to a vehicle over time.

This includes:

- vehicle profiles
- service history
- work logs
- registrations
- insurance
- custom specifications
- attachments and documents
- reminders
- exportable records and reports

The long-term aim is to provide a complete vehicle ownership record that is practical for enthusiasts, everyday owners, and future workshop-facing workflows.

---

## Core Principles

### Backend owns truth
All critical records, exports, calculations, and validations are driven by the backend.

### Frontend provides clarity
The UI is responsible for presentation, state handling, and user flow — not business truth.

### Non-blocking UX
The interface avoids browser `alert()` and `confirm()` usage in favor of inline feedback, auto-dismiss states, and production-grade action handling.

### Real exports
Exports are generated from real backend data and are intended to be user-ready, branded, and professional.

### Clean extensibility
New features must extend established patterns rather than introduce one-off logic or inconsistent UI behavior.

---

## Current Functional Areas

AutoFolio currently includes or is actively building toward support for:

- Vehicle management
- Service history tracking
- Work log tracking
- Lifetime cost summaries
- Document and attachment storage
- Registration tracking
- Insurance tracking
- Reminder management
- Custom vehicle specs
- Public report sharing
- PDF export flows
- ZIP document export

---

## Work Log System

The Work Log system is one of the current major feature areas and is designed for tracking:

- planned repairs
- active work
- upgrades and modifications
- linked parts
- linked custom specs
- work-specific attachments
- estimated and final costs

### Export support
The Work Log system includes backend-generated PDF export support for job cards and work history.

These exports are intended to be:

- backend-driven
- branded
- shareable
- workshop-ready
- consistent with AutoFolio visual standards

---

## Architecture Overview

AutoFolio is structured around a strict backend/frontend contract.

### Backend responsibilities
- data ownership
- validation
- business rules
- export generation
- relationship enforcement
- persistence logic

### Frontend responsibilities
- rendering UI
- action handling
- loading/error states
- download flow orchestration
- non-blocking interaction patterns

This separation is intentional and is a core rule of the project.

---

## Development Workflow

This project uses a multi-agent workflow.

### Gemini A
Owns:
- backend work
- shared infrastructure
- route integrity
- repository hygiene
- data logic
- exports and validation

### Gemini B
Owns:
- frontend work
- UI implementation
- UX polish
- state handling
- visual consistency

### ChatGPT
Owns:
- architecture guidance
- system planning
- feature shaping
- workflow structure
- review logic
- continuity across feature phases

### Critical workflow rule
Frontend must always match backend routes exactly.

---

## Repository Goals

This repository is intended to provide:

- a clean source of truth for the AutoFolio codebase
- stable feature history through structured commits
- a foundation for branch-based feature development
- a reviewable project structure for ongoing architecture and code review

---

## Recommended Repository Structure

```text
backend/
frontend/
docs/
agent-prompts/
.github/
