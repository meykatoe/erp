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
});
