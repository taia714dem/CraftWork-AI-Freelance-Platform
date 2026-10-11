import { Controller, Post, Body, Inject } from '@nestjs/common';
import { AiService } from './ai.service.js';

@Controller('ai')
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

  @Post('test')
  async testAI(@Body('prompt') prompt: string) {
    return await this.aiService.testCommunication(prompt);
  }
}
