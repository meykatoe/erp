import { formatNo } from './sequence.service';

describe('formatNo', () => {
  it('組合前綴年月與四位流水號', () => {
    expect(formatNo('PO', new Date(2026, 2, 5), 7)).toBe('PO2026030007');
  });

  it('流水號超過四位時不截斷', () => {
    expect(formatNo('SO', new Date(2026, 11, 1), 12345)).toBe('SO20261212345');
  });
});
