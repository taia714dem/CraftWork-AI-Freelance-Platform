import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from './ai.service.js';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('AiService (with mocks)', () => {
  let aiService: AiService;
  let aiRepositoryMock: any;
  let openaiMock: any;

  beforeEach(() => {
    aiRepositoryMock = {
      findSessionById: vi.fn(),
      createMessage: vi.fn(),
      findOrCreateSession: vi.fn(),
      getMessagesBySessionId: vi.fn(),
      getLastAssistantMessage: vi.fn(), 
      saveFinalTask: vi.fn(),
    };
    openaiMock = {};

    aiService = new AiService(aiRepositoryMock, openaiMock);
  });

  //For SaveUserMessage
  it('should save user message if client is owner', async () => {
    //tell fake database to return this "found" data while resolving
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });
    aiRepositoryMock.createMessage.mockResolvedValue({ id: 'msg-1' });

    const result = await aiService.saveUserMessage(
      'session-1',
      'client-123',
      'Привет',
    );

    //checking the request is sent with the right arguments
    expect(aiRepositoryMock.createMessage).toHaveBeenCalledWith(
      'session-1',
      'user',
      'Привет',
      null,
    );
    expect(result).toEqual({ id: 'msg-1' });
  });

  it('should throw ForbiddenException if client is not owner', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'other-client',
    });
    await expect(
      aiService.saveUserMessage('session-1', 'client-123', 'Привет'),
    ).rejects.toThrow(ForbiddenException);
    expect(aiRepositoryMock.createMessage).not.toHaveBeenCalled();
  });

  //For createSession
  it('should create session with clientId', async () => {
    aiRepositoryMock.findOrCreateSession.mockResolvedValue({
      id: 'session-1',
    });
    const result = await aiService.createSession('client-123');
    expect(aiRepositoryMock.findOrCreateSession).toHaveBeenCalledWith(
      'client-123',
    );
    expect(result).toEqual({ id: 'session-1' });
  });

  //For createMessage
  it('should create income message', async () => {
    aiRepositoryMock.createMessage.mockResolvedValue({ id: 'msg-1' });
    const result = await aiService.createMessage(
      'session-1',
      'user',
      'Привет',
      null,
    );
    expect(aiRepositoryMock.createMessage).toHaveBeenCalledWith(
      'session-1',
      'user',
      'Привет',
      null,
    );
    expect(result).toEqual({ id: 'msg-1' });
  });

  //For getMessages
  it('should get all messages with transformed prices if client is owner', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });

    const mockAiFields = {
      chat_message: 'Привет',
      suggested_buttons: [],
      is_initial_phase: true,
      is_final_spec: false,
      pricing_options: [
        {
          stack: 'React',
          is_recommended: false,
          grade_options: [
            {
              grades: ['Junior'],
              is_recommended: false,
              hours: { frontend: [10, 20] },
            },
          ],
        },
      ],
      order_data: null,
    };

    aiRepositoryMock.getMessagesBySessionId.mockResolvedValue([
      { id: 'msg-1', role: 'user', content: 'Привет', aiJsonFields: null },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Здравствуйте',
        aiJsonFields: mockAiFields,
      },
    ]);

    const result = await aiService.getMessages('session-1', 'client-123');

    expect(aiRepositoryMock.getMessagesBySessionId).toHaveBeenCalledWith(
      'session-1',
    );

    expect(result.length).toBe(2);

    expect(result[0].role).toBe('user');
    expect(result[0].aiJsonFields).toBeNull();

    expect(result[1].role).toBe('assistant');
    expect((result[1].aiJsonFields as any).pricing_options).toBeUndefined();
    expect((result[1].aiJsonFields as any).stacks).toBeDefined();
    expect((result[1].aiJsonFields as any).stacks[0].stackName).toBe('React');
  });
  it('should throw ForbiddenException if client is not owner', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'hacker-999',
    });
    await expect(
      aiService.getMessages('session-1', 'client-123'),
    ).rejects.toThrow(ForbiddenException);
    expect(aiRepositoryMock.getMessagesBySessionId).not.toHaveBeenCalled();
  });

  //Sync check for streamMessage
  it('should check access and fetch history before streaming', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });
    aiRepositoryMock.getMessagesBySessionId.mockResolvedValue([]);
    openaiMock.chat = {
      completions: {
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const result = await aiService.streamMessage('session-1', 'client-123');

    expect(aiRepositoryMock.findSessionById).toHaveBeenCalledWith('session-1');
    expect(aiRepositoryMock.getMessagesBySessionId).toHaveBeenCalledWith(
      'session-1',
    );
    expect(result).toBeDefined();
  });

  //For sendMessageSync
  it('should return parsed AI message and save it to DB', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });
    aiRepositoryMock.getMessagesBySessionId.mockResolvedValue([]);
    aiRepositoryMock.createMessage.mockResolvedValue({ id: 'msg-1' });

    openaiMock.chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content:
                  '{"chat_message": "ok", "is_initial_phase": true, "is_final_spec": false, "suggested_buttons": [], "pricing_options": [], "order_data": null}',
              },
            },
          ],
        }),
      },
    };

    const result = await aiService.sendMessageSync('session-1', 'client-123');

    expect(aiRepositoryMock.createMessage).toHaveBeenCalledWith(
      'session-1',
      'assistant',
      expect.any(String),
      expect.any(Object),
    );
    expect(result).toHaveProperty('chat_message', 'ok');
  });

  it('should throw Error if OpenAI returns invalid JSON', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });
    aiRepositoryMock.getMessagesBySessionId.mockResolvedValue([]);
    openaiMock.chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Not a JSON' } }],
        }),
      },
    };

    await expect(
      aiService.sendMessageSync('session-1', 'client-123'),
    ).rejects.toThrow(); // Ждем, что упадет (SyntaxError от JSON.parse)

    expect(aiRepositoryMock.createMessage).not.toHaveBeenCalled(); // Не должно сохранять мусор
  });

  //For saveFinalTask
  it('should save final task if AI marked is_final_spec=true', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });
    aiRepositoryMock.getLastAssistantMessage.mockResolvedValue({
      role: 'assistant',
      aiJsonFields: {
        is_final_spec: true,
        order_data: {
          title: 'Test',
          specification: 'Spec',
          stack: [],
          gradeRequired: 'Middle',
          role: [],
          customer_comments: null,
          required_materials_list: [],
        },
        pricing_options: [
          {
            stack: 'React',
            is_recommended: true,
            grade_options: [
              {
                grades: ['Middle'],
                is_recommended: true,
                hours: { frontend: [10] },
              },
            ],
          },
        ],
      },
    });

    aiRepositoryMock.saveFinalTask.mockResolvedValue({
      id: 'order-123',
      status: 'DRAFT',
    });

    const result = await aiService.saveFinalTask('session-1', 'client-123');

    expect(aiRepositoryMock.saveFinalTask).toHaveBeenCalled();
    expect(result).toEqual({ id: 'order-123', status: 'DRAFT' });
  });

  it('should throw BadRequestException if AI has no final_spec', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });
    aiRepositoryMock.getLastAssistantMessage.mockResolvedValue({
      role: 'assistant',
      aiJsonFields: { is_final_spec: false, order_data: null },
    });

    await expect(
      aiService.saveFinalTask('session-1', 'client-123'),
    ).rejects.toThrow(BadRequestException);

    expect(aiRepositoryMock.saveFinalTask).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if no messages found', async () => {
    aiRepositoryMock.findSessionById.mockResolvedValue({
      id: 'session-1',
      clientId: 'client-123',
    });
    aiRepositoryMock.getLastAssistantMessage.mockResolvedValue(null);

    await expect(
      aiService.saveFinalTask('session-1', 'client-123'),
    ).rejects.toThrow(BadRequestException);
  });
});
