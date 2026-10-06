import { Module } from '@nestjs/common';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';
import { OrderRepository } from './order.repository.js'


@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderRepository]
})
export class OrderModule {}