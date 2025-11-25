import { lineAmount, movingAverage, round2, sum } from './money';

describe('money', () => {
  it('四捨五入到小數兩位', () => {
    expect(round2('1.005').toString()).toBe('1.01');
    expect(round2(2.344).toString()).toBe('2.34');
  });

  it('明細金額為數量乘單價', () => {
    expect(lineAmount(3, '10.5').toString()).toBe('31.5');
  });
});
