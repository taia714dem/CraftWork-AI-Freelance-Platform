import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import OpenAI from 'openai';
import {
  SYSTEM_EDITOR_PROMPT,
  SYSTEM_TEHNICAL_TASK_PROMPT,
  SYSTEM_GRADE_PROMPT,
  SYSTEM_MATCHING_PROMPT,
} from './ai.prompts.js';
import { AiRepository } from './ai.repository.js';
import { GRADE_HOURLY_RATES } from './ai.config.js';
import {
  AiJsonFieldsDto,
  GradeOptionDto,
  HoursDto,
  OrderDataDto,
  PricingOptionDto,
} from './dto/ai-consultant.dto.js';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ChatCompletionMessageParam } from 'openai/resources';
import { AiGradeResponseDto } from './dto/ai-grade.dto.js';
import { AiMatchingResponseDto } from './dto/ai-matching.dto.js';

export type PricesDto = Record<string, [number, number?] | null>;

export function getRate(grade: string, role: string) {
  const rate = GRADE_HOURLY_RATES[grade]?.[role];
  if (rate === undefined) throw new Error(`Нет ставки для ${role} на ${grade}`);
  return rate;
}

export function count_prices(
  hours: HoursDto,
  grades: string[],
): PricesDto | null {
  if (grades.length === 0) return null;
  const prices = Object.fromEntries(
    Object.entries(hours).map(([role, value]) => {
      const hoursValue = value as [number, number] | null | undefined;
      if (!hoursValue) return [role, null];
      const rate = getRate(grades.at(-1)!, role);
      return [role, hoursValue.map((h) => h * rate)];
    }),
  ) as PricesDto;
  return prices;
}

export function sumPrices(prices: PricesDto): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const value of Object.values(prices)) {
    if (value) {
      min += value[0];
      max += value[1] ?? value[0];
    }
  }
  return { min, max };
}

export function buildStacks(pricingOptions: PricingOptionDto[]) {
  return pricingOptions.map((option) => {
    const grades = option.grade_options.map((gradeOption) => {
      const prices = count_prices(gradeOption.hours, gradeOption.grades);
      const { min, max } = prices ? sumPrices(prices) : { min: 0, max: 0 };
      return {
        gradeName: gradeOption.grades.join('/'),
        isRecommended: gradeOption.is_recommended,
        minPrice: min,
        maxPrice: max,
      };
    });

    const stackMin = Math.min(...grades.map((g) => g.minPrice));
    const stackMax = Math.max(...grades.map((g) => g.maxPrice));

    return {
      stackName: option.stack,
      isRecommended: option.is_recommended,
      minPrice: stackMin,
      maxPrice: stackMax,
      grades: grades,
    };
  });
}

@Injectable()
export class AiService implements OnModuleInit {
  constructor(
    @Inject(AiRepository)
    private aiRepository: AiRepository,
    private openai: OpenAI,
  ) {}

  private async ensureSessionOwnership(sessionId: string, clientId: string) {
    const session = await this.aiRepository.findSessionById(sessionId);

    console.log('=== DEBUG ===');
    console.log('sessionId из URL:', sessionId);
    console.log('clientId из токена:', clientId);
    console.log('clientId из БД:', session?.clientId);

    if (!session || session.clientId !== clientId) {
      throw new ForbiddenException('Нет доступа к этой сессии');
    }
    return session;
  }

  onModuleInit() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  //AI-Consultant
  async createSession(clientId: string) {
    const session = await this.aiRepository.findOrCreateSession(clientId);
    return session;
  }

  async createMessage(
    sessionId: string,
    role: string,
    content: string,
    aiJsonFields: any,
  ) {
    const message = await this.aiRepository.createMessage(
      sessionId,
      role,
      content,
      aiJsonFields,
    );
    return message;
  }

  async saveUserMessage(sessionId: string, clientId: string, message: string) {
    await this.ensureSessionOwnership(sessionId, clientId);
    return this.createMessage(sessionId, 'user', message, null);
  }

  async getMessages(sessionId: string, clientId: string) {
    //Access check first
    const session = await this.aiRepository.findSessionById(sessionId);
    if (!session || session.clientId !== clientId) {
      throw new ForbiddenException('Нет доступа к этой сессии');
    }

    const messages = await this.aiRepository.getMessagesBySessionId(sessionId);
    const messagesWithPrices = messages.map((message) => {
      if (message.role != 'assistant' || !message.aiJsonFields) {
        return message;
      }
      const aiFields = message.aiJsonFields as unknown as AiJsonFieldsDto;
      return {
        ...message,
        aiJsonFields: {
          ...aiFields,
          pricing_options: undefined,
          stacks: buildStacks(aiFields.pricing_options),
        },
      };
    });

    return messagesWithPrices;
  }

  async streamMessage(
    sessionId: string,
    clientId: string,
  ): Promise<Observable<MessageEvent>> {
    await this.ensureSessionOwnership(sessionId, clientId);

    const history = await this.aiRepository.getMessagesBySessionId(sessionId);
    const openAiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_TEHNICAL_TASK_PROMPT },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    return new Observable<MessageEvent>((subscriber) => {
      this.openai.chat.completions
        .create({
          model: 'gpt-4o-mini',
          messages: openAiMessages,
          stream: true,
        })
        .then(async (stream) => {
          let fullText = '';

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              subscriber.next({ data: { chunk: content } });
            }
          }

          try {
            const parsed = JSON.parse(fullText);
            const aiFields = plainToInstance(AiJsonFieldsDto, parsed);
            const errors = await validate(aiFields);

            if (errors.length > 0) {
              subscriber.error(
                new Error(
                  `Ошибки валидации ответа ИИ: ${errors.map((e) => JSON.stringify(e.constraints)).join(', ')}`,
                ),
              );
              return;
            }

            await this.createMessage(sessionId, 'assistant', fullText, parsed);

            subscriber.next({ data: { done: true, fullText } });
            subscriber.complete();
          } catch (e) {
            subscriber.error(
              new Error(`Ответ ИИ не является валидным JSON: ${fullText}`),
            );
          }
        })
        .catch((err) => {
          subscriber.error(err);
        });
    });
  }

  async sendMessageSync(sessionId: string, clientId: string) {
    await this.ensureSessionOwnership(sessionId, clientId);

    const history = await this.aiRepository.getMessagesBySessionId(sessionId);
    const openAiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_TEHNICAL_TASK_PROMPT },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAiMessages,
    });

    const fullText = response.choices[0]?.message?.content || '{}';

    const parsed = JSON.parse(fullText);
    const aiFields = plainToInstance(AiJsonFieldsDto, parsed);
    const errors = await validate(aiFields);

    if (errors.length > 0) {
      throw new Error(
        `Ошибки валидации ответа ИИ: ${errors.map((e) => JSON.stringify(e.constraints)).join(', ')}`,
      );
    }

    await this.createMessage(sessionId, 'assistant', fullText, parsed);

    return parsed;
  }

  async saveFinalTask(sessionId: string, clientId: string) {
    await this.ensureSessionOwnership(sessionId, clientId);
    const message = await this.aiRepository.getLastAssistantMessage(sessionId);
    if (!message || message.role != 'assistant' || !message.aiJsonFields) {
      throw new BadRequestException('Сообщений от ИИ нет');
    }
    const aiFields = message.aiJsonFields as unknown as AiJsonFieldsDto;
    if (!aiFields.is_final_spec) {
      throw new BadRequestException('ТЗ ещё не утверждено');
    }

    if (!aiFields.order_data) {
      throw new BadRequestException('ИИ не сформировал order_data');
    }
    const order_data = aiFields.order_data as OrderDataDto;
    const stacks = buildStacks(aiFields.pricing_options);
    const totalPriceRub = stacks[0]?.minPrice ?? 0;

    return this.aiRepository.saveFinalTask(clientId, order_data, totalPriceRub);
  }

  //AI-Editor
  async editDescription(description: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_EDITOR_PROMPT },
        { role: 'user', content: description },
      ],
    });

    return response;
  }

  //AI-Grade
  async giveGrade(clientId: string, role: string) {
    const clientPortfolio = await this.aiRepository.getSpecializationPortfolio(
      clientId,
      role,
    );
    if (!clientPortfolio) {
      throw new BadRequestException('Портфолио не найдено');
    }

    const userMessage = `Роль: ${role}. Данные портфолио: ${JSON.stringify(clientPortfolio)}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_GRADE_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const fullText = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(fullText);

    const gradeDto = plainToInstance(AiGradeResponseDto, parsed);
    const errors = await validate(gradeDto);
    if (errors.length > 0) {
      throw new Error('ИИ вернул неверный формат грейда');
    }

    return gradeDto;
  }

  //AI-Matching
  async giveAIMatchScore(
    orderId: string,
    responseId: string,
  ) {
    const clientTask = await this.aiRepository.takeClientTask(orderId);
    const workerResponse = await this.aiRepository.takeWorkerResponse(responseId);

    if (!clientTask) {
      throw new BadRequestException('Заказ не найден');
    }
    if (!workerResponse) {
      throw new BadRequestException('Отклик не найден');
    }

    const reponseMessage = `Проект заказчика: ${JSON.stringify(clientTask)}, отклик исполнителя: ${JSON.stringify(workerResponse)}`;
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_MATCHING_PROMPT },
        { role: 'user', content: reponseMessage },
      ],
    });

    const fullText = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(fullText);

    const matchDto = plainToInstance(AiMatchingResponseDto, parsed);
    const errors = await validate(matchDto);
    if (errors.length > 0) {
      throw new Error('ИИ вернул неверный формат мэтчинга');
    }

    await this.aiRepository.updateResponseAiScore(responseId, matchDto.score);

    return matchDto;

    
  }
}
