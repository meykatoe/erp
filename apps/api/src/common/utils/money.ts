import { Prisma } from '@prisma/client';

export type Num = Prisma.Decimal | number | string;

export const D = (v: Num) => new Prisma.Decimal(v);

export const ZERO = new Prisma.Decimal(0);

export function round2(v: Num) {
  return D(v).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function lineAmount(qty: Num, price: Num) {
  return round2(D(qty).mul(D(price)));
}
