import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {

  const totalWorkers = parseInt(process.argv[2], 10);
  if (!totalWorkers || isNaN(totalWorkers)) {
    throw new Error('Необходимо указать количество воркеров числовым аргументом.');
  }

  console.log(`START: ${totalWorkers}`);

  await prisma.response.deleteMany({});
  await prisma.workerSkill.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.order.deleteMany({});

  for (let i = 1; i <= totalWorkers; i++) {
    const isMatching = i % 3 === 0;

    await prisma.worker.create({
      data: {
        tgId: `worker_tg_${totalWorkers}_${i}`,
        fullName: isMatching ? `Matching Worker ${i}` : `Regular Worker ${i}`,
        grade: isMatching ? 'MIDDLE' : (i % 2 === 0 ? 'JUNIOR' : 'SENIOR'),
        skills: {
          create: isMatching
            ? [
                { role: 'BACKEND', skillName: 'Nest.js' },
                { role: 'BACKEND', skillName: 'TypeScript' },
                { role: 'BACKEND', skillName: 'PostgreSQL' },
                { role: 'BACKEND', skillName: 'Docker' }
              ]
            : [
                { role: 'FRONTEND', skillName: 'React' },
                { role: 'FRONTEND', skillName: 'JavaScript' },
                { role: 'DESIGNER', skillName: 'Figma' },
                { role: 'DESIGNER', skillName: 'UI-UX' }
              ]
        }
      }
    });

    if (i % 25000 === 0) {
      console.log(`Progress: ${i}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('END');
  });
