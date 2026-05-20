import { PurchaseStatus } from '@prisma/client';
import { Transitions } from '../common/utils/state';

export const PURCHASE_TRANSITIONS: Transitions<PurchaseStatus> = {
  DRAFT: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['PARTIALLY_RECEIVED', 'RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
};
