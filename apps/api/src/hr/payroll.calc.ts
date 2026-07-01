import { D, Num, round2 } from '../common/utils/money';

export const INSURANCE_RATE = 0.06;
const TAX_FREE = 40_000;
const TAX_MID = 80_000;

export function withholdingTax(taxable: Num) {
  const t = D(taxable);
  if (t.lte(TAX_FREE)) return D(0);
  const mid = t.gt(TAX_MID) ? D(TAX_MID - TAX_FREE) : t.sub(TAX_FREE);
  const high = t.gt(TAX_MID) ? t.sub(TAX_MID) : D(0);
  return round2(mid.mul(0.05).add(high.mul(0.12)));
}
