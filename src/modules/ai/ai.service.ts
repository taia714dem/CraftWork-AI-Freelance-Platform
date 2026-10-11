import { Injectable, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { SYSTEM_TEST_PROMPT } from './ai.prompts.js';

@Injectable()
export class AiService implements OnModuleInit {
  private openai: OpenAI;

  onModuleInit() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async testCommunication(promt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_TEST_PROMPT,
        },
        {
          role: 'user',
          content: promt,
        },
      ],
    });
    return response.choices[0].message.content || '{}';
  }
}
