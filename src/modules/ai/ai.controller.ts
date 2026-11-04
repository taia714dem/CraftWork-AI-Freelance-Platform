import {
  Controller,
  Post,
  Body,
  Inject,
  UnauthorizedException,
  Get,
  Sse,
  MessageEvent,
  Headers,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service.js';

import { ClientId } from '../../common/decorators/client-id.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ClientMessageDto } from './dto/ai-consultant.dto.js';
import { Observable } from 'rxjs';
import { AiEditorRequestDto } from './dto/ai-editor.dto.js';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

  //AI-Consultant
  @Post('sessions')
  async findOrCreateSession(@ClientId() clientId: string) {
    const session = await this.aiService.createSession(clientId);
    return { sessionId: session.id };
  }

  @Get('sessions/:id/messages')
  async getMessages(
    @Param('id') sessionId: string,
    @ClientId() clientId: string,
  ) {
    return this.aiService.getMessages(sessionId, clientId);
  }

  @Post('sessions/:id/messages')
  async saveUserMessage(
    @Param('id') sessionId: string,
    @ClientId() clientId: string,
    @Body() content: ClientMessageDto,
  ) {
    return this.aiService.saveUserMessage(sessionId, clientId, content.message);
  }

  @Sse('sessions/:id/stream')
  async streamMessage(
    @Param('id') sessionId: string,
    @ClientId() clientId: string,
  ): Promise<Observable<MessageEvent>> {
    return this.aiService.streamMessage(sessionId, clientId);
  }

  @Post('sessions/:id/messages/sync')
  async sendMessageSync(
    @Param('id') sessionId: string,
    @ClientId() clientId: string,
  ) {
    return this.aiService.sendMessageSync(sessionId, clientId);
  }

  @Post('sessions/:id/task')
  async saveFinalTask(
    @Param('id') sessionId: string,
    @ClientId() clientId: string,
  ) {
    return this.aiService.saveFinalTask(sessionId, clientId);
  }

  //AI-Editor
  @Post('/edit')
  async editDescription(
    @ClientId() clientId: string,
    @Body() description: AiEditorRequestDto,
  ) {
    return this.aiService.editDescription(description.raw_description);
  }

  //AI-Grade
  async giveGrade(
    @ClientId() clientId: string,
    @Body() role: string,
  ) {
    return this.aiService.giveGrade(clientId, role);
  }


}
