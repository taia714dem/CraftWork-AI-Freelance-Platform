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

  // Очистка в правильном порядке (дочерние -> родительские)
  await prisma.response.deleteMany({});
  await prisma.portfolioCase.deleteMany({});
  await prisma.workerSkill.deleteMany({});
  await prisma.workerSpecialization.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.order.deleteMany({});

  for (let i = 1; i <= totalWorkers; i++) {
    const isMatching = i % 3 === 0;

    // 1. Создаем воркера
    const worker = await prisma.worker.create({
      data: {
        tgId: `worker_tg_${totalWorkers}_${i}`,
        fullName: isMatching ? `Matching Worker ${i}` : `Regular Worker ${i}`,
      },
    });

    // 2. Создаем специализацию
    const specialization = await prisma.workerSpecialization.create({
      data: {
        workerId: worker.id,
        role: isMatching ? 'BACKEND' : 'FRONTEND', // Роль
        yearsOfExperience: isMatching ? 3.5 : 1.0,
        grade: isMatching ? 'MIDDLE' : 'JUNIOR',   // Грейд
      },
    });

    // 3. Навыки (СТРОГО ПО 4 ШТУКИ НА КАЖДОГО)
    // Чтобы получить 600 000 навыков для 150 000 воркеров.
    const skillsData = isMatching
      ? ['Nest.js', 'TypeScript', 'PostgreSQL', 'Docker'] // 4 нужных для мэтчинга
      : ['React', 'JavaScript', 'HTML', 'CSS'];          // 4 фоновых для остальных

    await prisma.workerSkill.createMany({
      data: skillsData.map((skillName) => ({
        specializationId: specialization.id,
        skillName: skillName,
      })),
    });

    // 4. Портфолио (добавим только "идеальным", чтобы не раздувать БД лишним)
    if (isMatching) {
        await prisma.portfolioCase.create({
            data: {
                specializationId: specialization.id,
                title: 'Backend HighLoad API',
                technical_description: 'Разработка REST API на Nest.js с использованием PostgreSQL.',
                client_description: 'Быстрый бекенд для интернет-магазина.',
                skills: ['Nest.js', 'TypeScript', 'PostgreSQL', 'Docker'],
                isCommercial: true
            }
        })
    }

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