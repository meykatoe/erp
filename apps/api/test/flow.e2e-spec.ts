import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

describe('ERP 主要流程', () => {
  let app: INestApplication;
  let token = '';
  const sfx = Date.now().toString(36);
  const api = () => request(app.getHttpServer());
  const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    configureApp(app);
    await app.init();

    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: process.env.ADMIN_PASSWORD ?? 'Admin12345' });
    token = res.body.accessToken;
  });

  afterAll(() => app.close());

  it('未登入不可存取', async () => {
    await api().get('/api/products').expect(401);
  });

  it('錯誤密碼登入失敗', async () => {
    await api()
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'x' })
      .expect(401);
  });

  it('資料驗證會擋下不合法輸入', async () => {
    await auth(api().post('/api/products')).send({ sku: '', name: 'x', price: -1 }).expect(400);
  });
});
