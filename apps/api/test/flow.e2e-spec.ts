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

  describe('採購到銷售到收付款', () => {
    let productId: string;
    let warehouseId: string;
    let supplierId: string;
    let customerId: string;
    let poId: string;
    let soId: string;

    it('建立主檔', async () => {
      const wh = await auth(api().post('/api/warehouses'))
        .send({ code: `W${sfx}`, name: '測試倉' })
        .expect(201);
      warehouseId = wh.body.id;
      const p = await auth(api().post('/api/products'))
        .send({ sku: `SKU-${sfx}`, name: '測試商品', price: 200, reorderPoint: 5 })
        .expect(201);
      productId = p.body.id;
      const s = await auth(api().post('/api/suppliers'))
        .send({ code: `S${sfx}`, name: '測試供應商', termDays: 30 })
        .expect(201);
      supplierId = s.body.id;
      const c = await auth(api().post('/api/customers'))
        .send({ code: `C${sfx}`, name: '測試客戶', creditLimit: 100000 })
        .expect(201);
      customerId = c.body.id;
    });

    it('重複代碼回傳 409', async () => {
      await auth(api().post('/api/warehouses'))
        .send({ code: `W${sfx}`, name: '重複' })
        .expect(409);
    });

    it('採購單建立與核准', async () => {
      const po = await auth(api().post('/api/purchase-orders'))
        .send({ supplierId, warehouseId, items: [{ productId, quantity: 10, unitPrice: 100 }] })
        .expect(201);
      poId = po.body.id;
      expect(po.body.total).toBe('1000');
      await auth(api().post(`/api/purchase-orders/${poId}/approve`)).expect(201);
    });

    it('未核准前不可收貨,核准後分批收貨', async () => {
      const po = await auth(api().get(`/api/purchase-orders/${poId}`)).expect(200);
      const itemId = po.body.items[0].id;
      await auth(api().post(`/api/purchase-orders/${poId}/receive`))
        .send({ items: [{ itemId, quantity: 11 }] })
        .expect(400);
      const r1 = await auth(api().post(`/api/purchase-orders/${poId}/receive`))
        .send({ items: [{ itemId, quantity: 4 }] })
        .expect(201);
      expect(r1.body.status).toBe('PARTIALLY_RECEIVED');
      const r2 = await auth(api().post(`/api/purchase-orders/${poId}/receive`))
        .send({ items: [{ itemId, quantity: 6 }] })
        .expect(201);
      expect(r2.body.status).toBe('RECEIVED');
    });

    it('庫存與成本正確', async () => {
      const lv = await auth(api().get(`/api/inventory/levels?warehouseId=${warehouseId}`)).expect(
        200,
      );
      expect(lv.body.items[0].quantity).toBe('10');
      const p = await auth(api().get(`/api/products/${productId}`)).expect(200);
      expect(Number(p.body.cost)).toBe(100);
    });

    it('銷售單超量出貨會被擋下', async () => {
      const so = await auth(api().post('/api/sales-orders'))
        .send({ customerId, warehouseId, items: [{ productId, quantity: 20, unitPrice: 200 }] })
        .expect(201);
      soId = so.body.id;
      await auth(api().post(`/api/sales-orders/${soId}/confirm`)).expect(201);
      const itemId = so.body.items[0].id;
      const res = await auth(api().post(`/api/sales-orders/${soId}/ship`))
        .send({ items: [{ itemId, quantity: 20 }] })
        .expect(400);
      expect(res.body.message).toContain('庫存不足');
    });

    it('部分出貨後產生應收', async () => {
      const so = await auth(api().get(`/api/sales-orders/${soId}`)).expect(200);
      const itemId = so.body.items[0].id;
      const res = await auth(api().post(`/api/sales-orders/${soId}/ship`))
        .send({ items: [{ itemId, quantity: 5 }] })
        .expect(201);
      expect(res.body.status).toBe('PARTIALLY_SHIPPED');
      const inv = await auth(api().get('/api/accounting/invoices?kind=AR&keyword=INV')).expect(200);
      expect(inv.body.items.some((i: { amount: string }) => i.amount === '1000')).toBe(true);
    });

    it('收款不可超過未結餘額', async () => {
      const inv = await auth(api().get('/api/accounting/invoices?kind=AR')).expect(200);
      const target = inv.body.items.find((i: { amount: string }) => i.amount === '1000');
      await auth(api().post(`/api/accounting/invoices/${target.id}/pay`))
        .send({ amount: 1500 })
        .expect(400);
      await auth(api().post(`/api/accounting/invoices/${target.id}/pay`))
        .send({ amount: 400 })
        .expect(201);
      const after = await auth(api().get('/api/accounting/invoices?kind=AR')).expect(200);
      expect(after.body.items.find((i: { id: string }) => i.id === target.id).status).toBe(
        'PARTIAL',
      );
    });

    it('試算表借貸平衡', async () => {
      const tb = await auth(api().get('/api/accounting/trial-balance')).expect(200);
      expect(tb.body.balanced).toBe(true);
    });

    it('手動分錄借貸不平衡會被拒絕', async () => {
      await auth(api().post('/api/accounting/journals'))
        .send({
          lines: [
            { code: '1000', debit: 100 },
            { code: '3100', credit: 90 },
          ],
        })
        .expect(400);
    });

    it('儀表板可取得', async () => {
      const d = await auth(api().get('/api/reports/dashboard')).expect(200);
      expect(d.body).toHaveProperty('receivable');
    });
  });
});
