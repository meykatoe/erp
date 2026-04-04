import { BadRequestException } from '@nestjs/common';
import { assertBalanced } from './accounting.service';

describe('assertBalanced', () => {
  it('借貸相等時通過', () => {
    expect(() =>
      assertBalanced([
        { code: '1000', debit: 100 },
        { code: '4100', credit: 100 },
      ]),
    ).not.toThrow();
  });

  it('借貸不等時拒絕', () => {
    expect(() =>
      assertBalanced([
        { code: '1000', debit: 100 },
        { code: '4100', credit: 90 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('單筆明細不可借貸並存', () => {
    expect(() =>
      assertBalanced([
        { code: '1000', debit: 50, credit: 50 },
        { code: '4100', debit: 50, credit: 50 },
      ]),
    ).toThrow(BadRequestException);
  });
});
