import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Создаем пул соединений драйвера pg
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Обертываем его в адаптер PrismaPg
    const adapter = new PrismaPg(pool);

    // 3. Передаем готовый адаптер в конструктор PrismaClient
    super({ adapter });
  }


    
  async onModuleInit() {
    await this.$connect();
  }
 
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
