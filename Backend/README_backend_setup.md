# AutoFolio Backend Setup

## 1. Environment Configuration
Create a `.env` file in the `Backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/autofolio?schema=public"
JWT_SECRET="your-super-secret-key"
```

## 2. Install Dependencies
```bash
npm install @prisma/client
npm install prisma --save-dev
```

## 3. Database Initialization
Generate the Prisma client and push the schema to your local PostgreSQL instance:
```bash
npx prisma generate
npx prisma db push
```

## 4. Key Architectural Rules
- **SpecHUB Link**: Use `UserVehicle.specId` to store the public string identifier from SpecHUB. Never duplicate SpecHUB technical data in this database.
- **Odometer Sync**: When a `ServiceEvent` is created with an odometer value, the backend logic should automatically insert a record into `OdometerReading`.
- **Reminder Engine**: When a `ServiceEvent` is logged that matches a `ReminderRule` label, mark the current `ReminderInstance` as `completed` and generate the next instance based on the rule's intervals.
- **Document Safety**: Invoices/Receipts are linked to `ServiceEvent` but set to `ON DELETE SET NULL`. This ensures that even if a service log is accidentally deleted, the physical document record remains attached to the vehicle.

## 5. Next Steps
1. Implement the **Auth Service** (NestJS + Passport).
2. Implement the **Vehicle Service** to handle CRUD for `UserVehicle` and `VehicleAttribute`.
3. Implement the **Maintenance Service** for `ServiceEvent` and `Document` uploads.
4. Build the **Reminder Engine** background task.
