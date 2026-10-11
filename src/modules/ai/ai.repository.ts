import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findOrCreateSession(clientId: string) {
    const session = await this.prisma.interviewSession.upsert({
      where: {
        clientId: clientId,
      },
      update: {},
      create: {
        clientId: clientId,
      },
    });
    return session;
  }

  async createMessage(sessionId: string, role: string, content: string, aiJsonFields: any){
    const message= await this.prisma.interviewMessage.create({
        data:{
            sessionId: sessionId,
            role: role,
            content: content,
            aiJsonFields: aiJsonFields
        }
    })
    return message;
  }

  async getMessagesBySessionId(sessionId:string){
    const messages=await this.prisma.interviewMessage.findMany({
        where:{
            sessionId: sessionId
        },
        orderBy:{
            createdAt: 'asc'
        }
    })
    return messages
  }
}
