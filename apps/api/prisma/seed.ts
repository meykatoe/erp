import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ACCOUNTS } from '../src/accounting/account-codes';
import { ROLE_PRESETS } from '../src/common/constants/permissions';

const prisma = new PrismaClient();

async function main() {
  for (const [name, preset] of Object.entries(ROLE_PRESETS)) {
    await prisma.role.upsert({
      where: { name },
      create: { name, ...preset },
      update: preset,
    });
  }

  for (const a of DEFAULT_ACCOUNTS) {
    await prisma.account.upsert({
      where: { code: a.code },
      create: a as never,
      update: { name: a.name },
    });
  }

  await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    create: { code: 'MAIN', name: '主倉庫' },
    update: {},
  });

  const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password && process.env.NODE_ENV === 'production') {
    throw new Error('正式環境必須設定 ADMIN_PASSWORD');
  }
  const admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
    await prisma.user.create({
      data: {
        email,
        name: '系統管理員',
        passwordHash: await bcrypt.hash(password ?? 'Admin12345', 10),
        roles: { create: { roleId: role.id } },
      },
    });
    console.log(`已建立管理員 ${email}`);
  }

  if (process.env.SEED_DEMO === '1') {
    await seedDemo();
  }
}

async function seedDemo() {
  const cat = await prisma.category.upsert({
    where: { name: '電子零件' },
    create: { name: '電子零件' },
    update: {},
  });
  for (const [sku, name, price] of [
    ['P-1001', '感測器模組', 350],
    ['P-1002', '控制主板', 1280],
    ['P-1003', '電源供應器', 760],
  ] as const) {
    await prisma.product.upsert({
      where: { sku },
      create: { sku, name, price, categoryId: cat.id, reorderPoint: 20 },
      update: {},
    });
  }
  await prisma.customer.upsert({
    where: { code: 'C-001' },
    create: { code: 'C-001', name: '示範客戶股份有限公司', termDays: 30, creditLimit: 500000 },
    update: {},
  });
  await prisma.supplier.upsert({
    where: { code: 'S-001' },
    create: { code: 'S-001', name: '示範供應商有限公司', termDays: 45 },
    update: {},
  });
  await prisma.department.upsert({
    where: { name: '管理部' },
    create: { name: '管理部' },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
