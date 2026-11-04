import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { AiJsonFieldsDto, OrderDataDto } from './dto/ai-consultant.dto.js';

@Injectable()
export class AiRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  //AI-Consultant
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

  async createMessage(
    sessionId: string,
    role: string,
    content: string,
    aiJsonFields: any,
  ) {
    const message = await this.prisma.interviewMessage.create({
      data: {
        sessionId: sessionId,
        role: role,
        content: content,
        aiJsonFields: aiJsonFields,
      },
    });
    return message;
  }

  async getMessagesBySessionId(sessionId: string) {
    const messages = await this.prisma.interviewMessage.findMany({
      where: {
        sessionId: sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return messages;
  }

  async findSessionById(sessionId: string) {
    return this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });
  }

  async saveFinalTask(
    clientId: string,
    message: OrderDataDto,
    totalPriceRub: number,
  ) {
    if (!message.title || !message.specification || !message.gradeRequired) {
      throw new Error(
        'Не хватает обязательных полей в order_data: title, specification, gradeRequired',
      );
    }
    const task = await this.prisma.order.create({
      data: {
        clientId: clientId,
        title: message.title,
        specification: message.specification,
        stack: message.stack,
        gradeRequired: message.gradeRequired,
        totalPriceRub: totalPriceRub,
        role: message.role,
        status: 'DRAFT',
      },
    });

    return task;
  }

  async getLastAssistantMessage(sessionId: string) {
    return await this.prisma.interviewMessage.findFirst({
      where: {
        sessionId: sessionId,
        role: 'assistant',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  //AI-Grade
  async getSpecializationPortfolio(clientId: string, role: string) {
    const specialization = await this.prisma.workerSpecialization.findFirst({
      where: {
        role: role,
        workerId: clientId,
      },
      include: {
        portfolio: true,
        skills: true,
      },
    });

    return specialization;
  }

  //AI-Matching
  async takeClientTask(orderId: string) {
    const task = await this.prisma.order.findFirst({
      where: { id: orderId },
    });
    if (!task) return null;

    return {
      title: task.title,
      specification: task.specification,
      stack: task.stack,
      gradeRequired: task.gradeRequired,
    };
  }

  async takeWorkerResponse(responseId: string) {
    const response = await this.prisma.response.findFirst({
      where: { id: responseId },
      include: {
        portfolioCase: true,
      },
    })
    if (!response) return null;

    return {
      portfolioCase: response.portfolioCase,
      daysTerm: response.daysTerm,
    };
  }

  async updateResponseAiScore(responseId: string, aiScore: number) {
    return this.prisma.response.update({
      where: { id: responseId },
      data: { aiScore: aiScore },
    });
  }
}
