import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrderModule } from './modules/order/order.module.js';



@Module({
  imports: [
    PrismaModule, OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
