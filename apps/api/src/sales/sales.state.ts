import { SalesStatus } from '@prisma/client';
import { Transitions } from '../common/utils/state';

export const SALES_TRANSITIONS: Transitions<SalesStatus> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PARTIALLY_SHIPPED', 'SHIPPED', 'CANCELLED'],
  PARTIALLY_SHIPPED: ['PARTIALLY_SHIPPED', 'SHIPPED'],
  SHIPPED: [],
  CANCELLED: [],
};
