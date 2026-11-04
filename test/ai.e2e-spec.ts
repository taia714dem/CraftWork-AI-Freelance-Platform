import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { config } from 'dotenv';
import { PrismaService } from '../prisma/prisma.service.js';
config({ path: '.env.test' });

describe('AI E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // В тесте
    prisma = app.get(PrismaService);
    await prisma.interviewMessage.deleteMany();
    await prisma.interviewSession.deleteMany();
    await prisma.order.deleteMany();

    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  //Create session
  it('POST /ai/sessions (create session)', async () => {
    const response = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);

    expect(response.body).toHaveProperty('sessionId');
    expect(typeof response.body.sessionId).toBe('string');
  });

  it('POST /ai/sessions (without token) should return 401', async () => {
    await request(app.getHttpServer()).post('/ai/sessions').expect(401);
  });

  //Get messages
  it('GET /ai/sessions/:id/messages (get messages)', async () => {
    //Create session
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    // Add messsage
    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages`)
      .set('Authorization', 'Bearer test-client-123')
      .send({ message: 'Hello' })
      .expect(201);

    // 3. Получаем историю
    const response = await request(app.getHttpServer())
      .get(`/ai/sessions/${sessionId}/messages`)
      .set('Authorization', 'Bearer test-client-123')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      role: expect.any(String),
      content: expect.any(String),
    });
  });
  it('GET /ai/sessions/:id/messages (without token) should return 401', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;
    await request(app.getHttpServer())
      .get(`/ai/sessions/${sessionId}/messages`)
      .expect(401);
  });
  it('GET /ai/sessions/:id/messages (another user) should return 403', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;
    await request(app.getHttpServer())
      .get(`/ai/sessions/${sessionId}/messages`)
      .set('Authorization', 'Bearer hacker-999')
      .expect(403);
  });

  // Post user message
  it('POST /ai/sessions/:id/messages (post user message)', async () => {
    //Create session
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    // Post messsage
    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages`)
      .set('Authorization', 'Bearer test-client-123')
      .send({ message: 'Hello' })
      .expect(201);
  });
  it('POST /ai/sessions/:id/messages (without token) should return 401', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;
    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages`)
      .expect(401);
  });
  it('POST /ai/sessions/:id/messages (another user) should return 403', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;
    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages`)
      .set('Authorization', 'Bearer hacker-999')
      .send({ message: 'Hello' })
      .expect(403);
  });
  it('POST /ai/sessions/:id/messages (empty message) should return 400', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages`)
      .set('Authorization', 'Bearer test-client-123')
      .send({ message: '' }) // Отправляем пустую строку
      .expect(400); // Ожидаем Bad Request
  });

  //SSE Stream
  it('GET /ai/sessions/:id/stream (stream messages)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .get(`/ai/sessions/${sessionId}/stream`)
      .set('Authorization', 'Bearer test-client-123')
      .expect(200);
  });
  it('GET /ai/sessions/:id/stream (without token) should return 401', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .get(`/ai/sessions/${sessionId}/stream`)
      .expect(401);
  });
  it('GET /ai/sessions/:id/stream (another user) should return 403', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .get(`/ai/sessions/${sessionId}/stream`)
      .set('Authorization', 'Bearer hacker-999')
      .expect(403);
  });

  // Post sync message
  it('POST /ai/sessions/:id/messages/sync (sync message)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages/sync`)
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
  });
  it('POST /ai/sessions/:id/messages/sync (without token) should return 401', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages/sync`)
      .expect(401);
  });
  it('POST /ai/sessions/:id/messages/sync (another user) should return 403', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/messages/sync`)
      .set('Authorization', 'Bearer hacker-999')
      .expect(403);
  });

  // Post final task
  it('POST /ai/sessions/:id/task (save final task)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await prisma.interviewMessage.create({
      data: {
        sessionId: sessionId,
        role: 'assistant',
        content: '{}',
        aiJsonFields: {
          is_final_spec: true,
          order_data: {
            title: 'Test Project',
            specification: 'Test Spec',
            stack: ['React'],
            gradeRequired: 'Middle',
            role: ['frontend'],
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
      },
    });

    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/task`)
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
  });

  it('POST /ai/sessions/:id/task (without token) should return 401', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer test-client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/task`)
      .expect(401);
  });

  it('POST /ai/sessions/:id/task (another user) should return 403', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/ai/sessions')
      .set('Authorization', 'Bearer client-123')
      .expect(201);
    const sessionId = createRes.body.sessionId;

    await request(app.getHttpServer())
      .post(`/ai/sessions/${sessionId}/task`)
      .set('Authorization', 'Bearer hacker-999')
      .expect(403);
  });
});
