
import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DEV_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

async function main() {
  console.log('Verifying work job links (parts and specs)...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 0. Ensure user exists
    await prisma.user.upsert({
      where: { id: DEV_USER_ID },
      update: {},
      create: {
        id: DEV_USER_ID,
        email: 'dev-work-links@autofolio.local',
        plan: 'pro'
      }
    });

    // 1. Get or Create a vehicle
    let vehicle = await prisma.userVehicle.findFirst({
      where: { userId: DEV_USER_ID }
    });

    if (!vehicle) {
      console.log('Creating test vehicle...');
      vehicle = await prisma.userVehicle.create({
        data: {
          userId: DEV_USER_ID,
          nickname: 'Work Links Test Vehicle',
          make: 'Test',
          model: 'Z',
          year: 2026
        }
      });
    }

    const vehicleId = vehicle.id;

    // 2. Create a test part and a test spec
    console.log('Creating test part and spec...');
    const part = await prisma.savedPart.create({
      data: { vehicleId, category: 'Main', name: 'Work Part', partNumber: 'WP1' }
    });
    const spec = await prisma.userVehicleCustomSpec.create({
      data: { vehicleId, group: 'Engine', label: 'Oil Weight', value: '5W-30' }
    });

    // 3. Create a work job with linked part and spec
    console.log('Creating work job with links...');
    const workJob = await prisma.workJob.create({
      data: {
        vehicleId,
        title: 'Initial Work',
        status: 'planned',
        parts: {
          create: [
            { savedPartId: part.id, quantity: 2, notes: 'Two filters' }
          ]
        },
        specs: {
          create: [
            { customSpecId: spec.id }
          ]
        }
      },
      include: {
        parts: { include: { savedPart: true } },
        specs: { include: { customSpec: true } }
      }
    });

    console.log('Initial Work Job:');
    console.log('- Title:', workJob.title);
    console.log('- Parts linked:', workJob.parts.length);
    console.log('- Specs linked:', workJob.specs.length);
    if (workJob.parts[0]) {
      console.log('- Part Name:', workJob.parts[0].savedPart.name);
      console.log('- Part Quantity:', workJob.parts[0].quantity);
    }
    if (workJob.specs[0]) {
      console.log('- Spec Label:', workJob.specs[0].customSpec.label);
    }

    // 4. Update the work job: remove part, change spec
    console.log('Updating work job: replacing links...');
    
    // Simulate updateWorkJob logic (deleteMany + create)
    const updatedWorkJob = await prisma.workJob.update({
      where: { id: workJob.id },
      data: {
        title: 'Updated Work',
        parts: {
          deleteMany: {},
          create: [] // removing parts
        },
        specs: {
          deleteMany: {},
          create: [
            { customSpecId: spec.id } // keeping/re-adding spec
          ]
        }
      },
      include: {
        parts: { include: { savedPart: true } },
        specs: { include: { customSpec: true } }
      }
    });

    console.log('Updated Work Job:');
    console.log('- Title:', updatedWorkJob.title);
    console.log('- Parts linked:', updatedWorkJob.parts.length);
    console.log('- Specs linked:', updatedWorkJob.specs.length);

    let success = true;
    if (workJob.parts.length !== 1) success = false;
    if (workJob.specs.length !== 1) success = false;
    if (updatedWorkJob.parts.length !== 0) success = false;
    if (updatedWorkJob.specs.length !== 1) success = false;

    if (success) {
      console.log('SUCCESS: Work job links persisted and updated correctly.');
    } else {
      console.error('FAILURE: Work job links not correctly applied.');
      process.exit(1);
    }

  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error during verification:', e);
    process.exit(1);
  });
