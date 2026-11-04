import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { AiRepository } from './ai.repository.js'; 
import OpenAI from 'openai';

@Module({
  controllers: [AiController],
  providers: [AiService, AiRepository,{
      provide: OpenAI,
      useFactory: () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    }],
  exports: [AiService],
})
export class AiModule {}
