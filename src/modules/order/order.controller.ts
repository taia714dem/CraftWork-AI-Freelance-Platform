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

@Controller('orders')
export class OrderController {
  constructor(
    @Inject(OrderService)
    private readonly orderService: OrderService,
  ) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Headers('authorization') authHeader: string,
  ) {
    try {
      //Проверка авторизации
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Вы не авторизованы');
      }
      const clientId = authHeader.split(' ')[1];
      if (!clientId) {
        throw new UnauthorizedException('Неверный токен');
      }

      dto.clientId = clientId;
      const createOrder = await this.orderService.createOrder(dto);
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
      await this.orderService.simulateResponses(orderId);
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
      return await this.orderService.getAllResponses(orderId);
    } catch (error) {
      console.error('=== ОШИБКА СБОРА ОТКЛИКОВ ===', error);
      throw new InternalServerErrorException('Не удалось собрать отклики');
    }
  }
}
