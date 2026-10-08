import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
  Param,
  Get,
} from '@nestjs/common';
import { OrderService } from './order.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject(OrderService)
    private readonly orderService: OrderService,
    // Delete later
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Headers('authorization') authHeader: string,
  ) {
    try {
      this.prismaService.resetMetrics(); // Delete later

      //Проверка авторизации
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Вы не авторизованы');
      }
      const clientId = authHeader.split(' ')[1];
      if (!clientId) {
        throw new UnauthorizedException('Неверный токен');
      }

      dto.clientId = clientId;
      const start = performance.now(); // Delete later
      const createOrder = await this.orderService.createOrder(dto);
      const totalTime = performance.now() - start; // Delete later
      // Delete later
      console.log(
        `\n[МЕТРИКИ POST /orders] Общее время: ${totalTime.toFixed(2)}мс | В базе (мс): ${this.prismaService.totalDbDuration.toFixed(2)} | Количество SQL-запросов: ${this.prismaService.queryCount}`,
      );

      return createOrder;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('=== КРИТИЧЕСКАЯ ОШИБКА БЭКЕНДА ===', error);
      throw new InternalServerErrorException(
        'Произошла системная ошибка при создании заказа',
      );
    }
  }

  @Post(':id/simulate-responses')
  async simulateResponses(@Param('id') orderId: string) {
    try {
      this.prismaService.resetMetrics(); // Delete later

      const start = performance.now();
      await this.orderService.simulateResponses(orderId);
      const totalTime = performance.now() - start;

      // Delete later
      console.log(
        `[МЕТРИКИ POST /simulate-responses] Общее время: ${totalTime.toFixed(2)}мс | В базе (мс): ${this.prismaService.totalDbDuration.toFixed(2)} | Количество SQL-запросов: ${this.prismaService.queryCount}`,
      );

      return { success: true };
    } catch (error) {
      console.error('=== ОШИБКА СИМУЛЯЦИИ ===', error);
      throw new InternalServerErrorException(
        'Не удалось запустить симуляцию откликов',
      );
    }
  }

  @Get(':id/responses')
  async getAllResponses(@Param('id') orderId: string) {
    try {
      this.prismaService.resetMetrics(); //Delete later

      //Change later on just "return"
      const start = performance.now();
      const res = await this.orderService.getAllResponses(orderId);
      const totalTime = performance.now() - start;

      // Delete later
      console.log(
        `\n[МЕТРИКИ GET /responses] Общее время: ${totalTime.toFixed(2)}мс | В базе (мс): ${this.prismaService.totalDbDuration.toFixed(2)} | Количество SQL-запросов: ${this.prismaService.queryCount}`,
      );

      return res;
    } catch (error) {
      console.error('=== ОШИБКА СБОРА ОТКЛИКОВ ===', error);
      throw new InternalServerErrorException('Не удалось собрать отклики');
    }
  }
}
