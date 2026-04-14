import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DEV_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

async function main() {
  console.log('Seeding development database...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // Ensure dev user exists
    const devUser = await prisma.user.upsert({
      where: { id: DEV_USER_ID },
      update: {},
      create: {
        id: DEV_USER_ID,
        email: 'dev@autofolio.local',
        defaultCurrency: 'AUD',
      },
    });

    console.log(`Development user ensured: ${devUser.email} (${devUser.id})`);
    console.log('Seeding complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  });
