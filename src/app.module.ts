import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrderModule } from './modules/order/order.module.js';
import { AiModule } from './modules/ai/ai.module.js';



@Module({
  imports: [
    PrismaModule, OrderModule, AiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
