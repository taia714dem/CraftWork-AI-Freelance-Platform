import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}
  
  //Zero matching requests
  async createOrder(data: Prisma.OrderCreateInput) {
    const order = await this.prisma.order.create({
      data: data,
    });
    return order;
  }

  async findWorkersBySkills(role:string[], stack: string[], grade:string){
    return await this.prisma.worker.findMany({
      where: {
        grade: grade,
        skills: {
          some: {
            role: {in: role},
            skillName: {in: stack}
          }
        }
      }
    })
  }

  async createInvitation(orderId: string, workerId: string){
    return await this.prisma.response.create({
      data: {
        orderId,
        workerId,
        status: 'INVITED',
        daysTerm: 0,
        vectorScore: 0
      }
    })
  }


  //Test request for mass responses
  async simulateResponses(orderId: string){
    return await this.prisma.response.updateMany({
      where: {
        orderId: orderId,
        status: 'INVITED'
      },
      data: {
        status: 'APPLIED',
      }
    })
  }

  
  async getAllResponses(orderId: string){
    return await this.prisma.order.findUnique(
      {
        where:{
          id: orderId
        },
        include: {
          responses: {
            where: {
              status: "APPLIED"
            },
            include:{
              worker: true
            }
          }
        }
      }
    )
  }
}
