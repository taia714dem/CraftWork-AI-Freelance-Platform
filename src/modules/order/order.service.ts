import { Injectable, Inject } from '@nestjs/common';
import { OrderRepository } from './order.repository.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrderService {
  constructor(
    @Inject(OrderRepository)
    private orderRepository: OrderRepository,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    //Safe Order
    const newOrder = await this.orderRepository.createOrder({
      clientId: dto.clientId,
      title: dto.title,
      specification: dto.specification,
      stack: dto.stack,
      gradeRequired: dto.gradeRequired,
      totalPriceRub: dto.totalPriceRub,
    });

    //Find Matching workers
    const matchingWorkers = await this.orderRepository.findWorkersBySkills(
      dto.role,
      dto.stack,
      dto.gradeRequired,
    );

    //Create Responses for sending order to workers
    if (matchingWorkers.length > 0) {
      const invitePromises = matchingWorkers.map((worker) =>
        this.orderRepository.createInvitation(newOrder.id, worker.id),
      );
      //Taking and doing the whole request
      await Promise.all(invitePromises);
    }

    return newOrder;
  }

  async simulateResponses(orderId: string) {
    return await this.orderRepository.simulateResponses(orderId);
  }

  async getAllResponses(orderId:string){
    return await this.orderRepository.getAllResponses(orderId);
  }
}
