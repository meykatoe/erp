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

export function calcPayroll(base: Num, bonus: Num = 0) {
  const gross = D(base).add(D(bonus));
  const deduction = round2(gross.mul(INSURANCE_RATE));
  const tax = withholdingTax(gross.sub(deduction));
  const net = gross.sub(deduction).sub(tax);
  return { gross: round2(gross), deduction, tax, net: round2(net) };
}

export function leaveDays(start: Date, end: Date) {
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) days++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

export function isLate(checkIn: Date, limitHour = 9, limitMinute = 15) {
  const minutes = checkIn.getHours() * 60 + checkIn.getMinutes();
  return minutes > limitHour * 60 + limitMinute;
}
