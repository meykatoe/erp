import { BadRequestException } from '@nestjs/common';
import { PURCHASE_TRANSITIONS } from '../../purchase/purchase.state';
import { SALES_TRANSITIONS } from '../../sales/sales.state';
import { assertTransition, canTransition } from './state';

describe('state machine', () => {
  it('採購單可由草稿核准', () => {
    expect(canTransition(PURCHASE_TRANSITIONS, 'DRAFT', 'APPROVED')).toBe(true);
  });

  it('採購單已取消不可再核准', () => {
    expect(() => assertTransition(PURCHASE_TRANSITIONS, 'CANCELLED', 'APPROVED')).toThrow(
      BadRequestException,
    );
  });

  it('部分收貨後不可取消', () => {
    expect(canTransition(PURCHASE_TRANSITIONS, 'PARTIALLY_RECEIVED', 'CANCELLED')).toBe(false);
  });

  it('銷售單必須先確認才能出貨', () => {
    expect(canTransition(SALES_TRANSITIONS, 'DRAFT', 'SHIPPED')).toBe(false);
    expect(canTransition(SALES_TRANSITIONS, 'CONFIRMED', 'SHIPPED')).toBe(true);
  });
});
