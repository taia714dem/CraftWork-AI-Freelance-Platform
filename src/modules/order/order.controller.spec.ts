import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';
import { UnauthorizedException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { describe, beforeEach, it, expect, vi } from 'vitest'; 

describe('OrderController (Тесты операций интерфейса)', () => {
  let controller: OrderController;

  const mockOrderService = {
    createOrder: vi.fn().mockResolvedValue({ id: 'order-777', title: 'NestJS Project' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockOrderService }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('должен успешно вернуть созданный заказ, если токен авторизации передан корректно', async () => {
    const dto: CreateOrderDto = {
      title: 'NestJS Project',
      specification: 'Specs',
      role: ['BACKEND'],
      stack: ['TypeScript'],
      gradeRequired: 'MIDDLE',
      totalPriceRub: 123
    };
    const authHeader = 'Bearer customer_id_999';

    const result = await controller.createOrder(dto, authHeader);

    expect(result).toHaveProperty('id');
    expect(result.title).toBe('NestJS Project');
    expect(dto.clientId).toBe('customer_id_999'); 
  });

  it('должен выбросить UnauthorizedException (401), если заголовок авторизации отсутствует', async () => {
    const dto: CreateOrderDto = {
      title: 'NestJS Project',
      specification: 'Specs',
      role: ['BACKEND'],
      stack: ['TypeScript'],
      gradeRequired: 'MIDDLE',
      totalPriceRub: 123
    };

    await expect(controller.createOrder(dto, '')).rejects.toThrow(UnauthorizedException);
    await expect(controller.createOrder(dto, 'InvalidPrefix 123')).rejects.toThrow(UnauthorizedException);
  });
});
