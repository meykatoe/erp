import { calcPayroll, isLate, leaveDays, withholdingTax } from './payroll.calc';

describe('payroll', () => {
  it('低於免稅額不扣稅', () => {
    expect(withholdingTax(39_000).toString()).toBe('0');
  });

  it('中間級距課 5%', () => {
    expect(withholdingTax(60_000).toString()).toBe('1000');
  });

  it('高級距加課 12%', () => {
    expect(withholdingTax(100_000).toString()).toBe('4400');
  });

  it('實領等於應發扣除保險與稅', () => {
    const r = calcPayroll(50_000, 0);
    expect(r.deduction.toString()).toBe('3000');
    expect(r.tax.toString()).toBe('350');
    expect(r.net.toString()).toBe('46650');
  });
});

describe('leave and attendance', () => {
  it('請假天數排除週末', () => {
    expect(leaveDays(new Date('2026-03-06'), new Date('2026-03-10'))).toBe(3);
  });

  it('超過九點十五分算遲到', () => {
    expect(isLate(new Date(2026, 0, 5, 9, 16))).toBe(true);
    expect(isLate(new Date(2026, 0, 5, 9, 15))).toBe(false);
  });
});
