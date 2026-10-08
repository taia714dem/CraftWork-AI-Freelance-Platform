import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service.js';
import { OrderRepository } from './order.repository.js';
import { describe, beforeEach, it, expect, vi } from 'vitest'; 

describe('OrderService (Тесты бизнес-правил мэтчинга)', () => {
  let service: OrderService;

  const mockOrderRepository = {
    createOrder: vi.fn().mockResolvedValue({ id: 'test-order-123' }),
    findWorkersBySkills: vi.fn(),
    createInvitation: vi.fn().mockResolvedValue({ id: 'invite-123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: mockOrderRepository },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('должен запустить рассылку приглашений, если найдены подходящие по стеку воркеры', async () => {
    mockOrderRepository.findWorkersBySkills.mockResolvedValue([{ id: 'worker-1' }, { id: 'worker-2' }]);

    const dto: any = {
      title: 'Test Order',
      specification: 'Specs',
      role: ['BACKEND'],
      stack: ['Nest.js'],
      gradeRequired: 'MIDDLE',
      totalPriceRub: 123
    };

    const result = await service.createOrder(dto);

    expect(mockOrderRepository.createInvitation).toHaveBeenCalledTimes(2);
    expect(result.id).toBe('test-order-123');
  });

  it('не должен создавать приглашения, если подходящих воркеров в базе не обнаружено', async () => {
    mockOrderRepository.findWorkersBySkills.mockResolvedValue([]);
    mockOrderRepository.createInvitation.mockClear();

    const dto: any = {
      title: 'Test Order',
      specification: 'Specs',
      role: ['DESIGNER'],
      stack: ['Photoshop'],
      gradeRequired: 'SENIOR',
      totalPriceRub: 123
    };

    await service.createOrder(dto);

    expect(mockOrderRepository.createInvitation).not.toHaveBeenCalled();
  });
});
