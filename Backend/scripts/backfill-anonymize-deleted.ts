import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Starting backfill to anonymize legacy soft-deleted users...");

  try {
    const legacyUsers = await prisma.user.findMany({
      where: {
        deletedAt: { not: null },
        NOT: {
          email: { startsWith: 'deleted+' }
        }
      }
    });

    console.log(`Found ${legacyUsers.length} legacy soft-deleted users to anonymize.`);

    for (const user of legacyUsers) {
      console.log(`Anonymizing user: ${user.email} (ID: ${user.id})...`);
      
      const anonymizedEmail = `deleted+${user.id}@autofolio.local`;

      // 1. Unlink OAuth Accounts and Sessions
      const accountDelete = await prisma.account.deleteMany({
        where: { userId: user.id }
      });
      console.log(`- Deleted ${accountDelete.count} OAuth account(s).`);

      const sessionDelete = await prisma.session.deleteMany({
        where: { userId: user.id }
      });
      console.log(`- Deleted ${sessionDelete.count} session(s).`);

      // 2. Anonymize User row
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: anonymizedEmail,
          name: 'Deleted User',
          passwordHash: null,
          image: null,
          dailyVehicleId: null
        }
      });
      console.log(`- Successfully anonymized User record.`);
    }

    console.log("Backfill complete.");

  } catch (err) {
    console.error("Backfill failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
