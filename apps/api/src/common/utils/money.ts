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

export function sum(values: Num[]) {
  return values.reduce<Prisma.Decimal>((a, b) => a.add(D(b)), ZERO);
}

export function movingAverage(oldQty: Num, oldCost: Num, inQty: Num, inPrice: Num) {
  const total = D(oldQty).add(D(inQty));
  if (total.lte(0)) return D(inPrice);
  const value = D(oldQty)
    .mul(D(oldCost))
    .add(D(inQty).mul(D(inPrice)));
  return value.div(total).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
}
