import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
