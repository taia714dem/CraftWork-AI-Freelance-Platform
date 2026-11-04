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
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('You are not authorized');
      }
      const clientId = authHeader.split(' ')[1];
      if (!clientId) {
        throw new UnauthorizedException('Wrong token');
      }

      dto.clientId = clientId;
      return this.orderService.createOrder(dto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'System mistake occured while order creating',
      );
    }
  }

  @Post(':id/simulate-responses')
  async simulateResponses(@Param('id') orderId: string) {
    try {
      await this.orderService.simulateResponses(orderId);
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to launch responses simulation',
      );
    }
  }

  @Get(':id/responses')
  async getAllResponses(@Param('id') orderId: string) {
    try {
      return this.orderService.getAllResponses(orderId);
    } catch (error) {
      throw new InternalServerErrorException('Error with recieving responses');
    }
  }
}
