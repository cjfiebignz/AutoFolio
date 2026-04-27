import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Checking for legacy soft-deleted users...");

  try {
    const legacyUsers = await prisma.user.findMany({
      where: {
        deletedAt: { not: null },
        NOT: {
          email: { startsWith: 'deleted+' }
        }
      },
      select: {
        id: true,
        email: true,
        deletedAt: true
      }
    });

    console.log(`Found ${legacyUsers.length} legacy soft-deleted users.`);
    legacyUsers.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, DeletedAt: ${u.deletedAt}`);
    });

  } catch (err) {
    console.error("Error finding legacy users:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
