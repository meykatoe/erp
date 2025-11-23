import { Prisma } from '@prisma/client';

export type Num = Prisma.Decimal | number | string;

export const D = (v: Num) => new Prisma.Decimal(v);

export const ZERO = new Prisma.Decimal(0);
