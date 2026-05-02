import 'dotenv/config';
import { PrismaClient, DeliveryChannel, DeliveryStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const userId = '550e8400-e29b-41d4-a716-446655440000'; // Test user ID
  
  console.log('--- Verifying Reminder Delivery Logic ---');

  // 1. Check if test user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error('Test user not found. Please run create-test-user script first.');
    return;
  }
  console.log(`Found test user: ${user.email}`);

  // 2. Check UserReminderDelivery model
  const count = await prisma.userReminderDelivery.count();
  console.log(`Current reminder deliveries in DB: ${count}`);

  // 3. Simulate a delivery record creation
  const testKey = `test-vehicle-SERVICE_DUE-AT_EVENT-2026-05-01`;
  
  // Find a vehicle for this user
  const vehicle = await prisma.userVehicle.findFirst({ where: { userId } });
  if (!vehicle) {
    console.warn('No vehicle found for test user. Cannot test full delivery record creation.');
  } else {
    console.log(`Using vehicle: ${vehicle.id} for test record`);
    
    // Clean up old test record if exists
    await prisma.userReminderDelivery.deleteMany({ where: { reminderKey: testKey } });

    const record = await prisma.userReminderDelivery.create({
      data: {
        userId,
        vehicleId: vehicle.id,
        reminderKey: testKey,
        reminderType: 'SERVICE_DUE',
        channel: DeliveryChannel.EMAIL,
        status: DeliveryStatus.SENT,
        sentAt: new Date(),
      }
    });
    console.log('Successfully created test delivery record:', record.id);

    // 4. Verify deduplication check would work
    const exists = await prisma.userReminderDelivery.findFirst({
      where: {
        reminderKey: testKey,
        channel: DeliveryChannel.EMAIL,
        status: DeliveryStatus.SENT,
      }
    });
    console.log(`Deduplication check: ${exists ? 'SUCCESS (Found existing)' : 'FAILURE'}`);

    // Clean up
    await prisma.userReminderDelivery.delete({ where: { id: record.id } });
    console.log('Cleaned up test record.');
  }

  console.log('--- Verification Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
