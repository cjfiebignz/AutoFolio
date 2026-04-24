# Prisma Schema Authority

This document defines the authoritative source of truth for the AutoFolio database schema to prevent architectural drift and developer confusion.

## 1. Authoritative Schema
The **Backend** schema is the absolute source of truth for the entire AutoFolio ecosystem:
- **Path:** `Backend/prisma/schema.prisma`
- **Responsibility:** All application data modelling, database migrations, and authoritative Prisma Client generation.
- **Workflow:** Any changes to the data model MUST be performed in this file and applied via standard Prisma migration flows in the `Backend/` directory.

## 2. Legacy / Secondary Schema
The **Frontend** schema is a secondary, legacy-related file:
- **Path:** `Frontend/mygarage-frontend/prisma/schema.prisma`
- **Status:** **DEPRECATED** for application logic.
- **Purpose:** This file survives strictly to support the `PrismaAdapter` used by NextAuth for authentication session management in the frontend.
- **Constraints:**
    - **DO NOT** add application features, models, or fields to this file.
    - **DO NOT** run migrations from the frontend directory unless specifically fixing authentication infrastructure.
    - **DO NOT** use the resulting Prisma Client for application-level data fetching or mutation.

## 3. Synchronization
While the schemas may drift as the Backend matures, the Frontend schema should only be updated when authentication requirements change or when a formal "schema unification" task is scheduled. Until then, treat the Backend schema as the only valid reference for AutoFolio's domain models.
