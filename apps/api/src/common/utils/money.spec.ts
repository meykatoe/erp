import { lineAmount, movingAverage, round2, sum } from './money';

describe('money', () => {
  it('四捨五入到小數兩位', () => {
    expect(round2('1.005').toString()).toBe('1.01');
    expect(round2(2.344).toString()).toBe('2.34');
  });

  it('明細金額為數量乘單價', () => {
    expect(lineAmount(3, '10.5').toString()).toBe('31.5');
  });

  it('加總不產生浮點誤差', () => {
    expect(sum([0.1, 0.2]).toString()).toBe('0.3');
  });

  it('移動平均成本', () => {
    expect(movingAverage(10, 100, 10, 200).toString()).toBe('150');
    expect(movingAverage(0, 0, 5, 80).toString()).toBe('80');
  });
});
