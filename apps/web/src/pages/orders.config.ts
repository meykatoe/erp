export interface OrderConfig {
  base: string;
  route: string;
  title: string;
  partyKey: 'supplier' | 'customer';
  partyIdKey: 'supplierId' | 'customerId';
  partyEndpoint: string;
  partyLabel: string;
  writePerm: string;
  approvePerm: string;
  fulfillPerm: string;
  approveAction: 'approve' | 'confirm';
  approveLabel: string;
  fulfillAction: 'receive' | 'ship';
  fulfillLabel: string;
  doneKey: 'receivedQty' | 'shippedQty';
  doneLabel: string;
  priceKey: 'cost' | 'price';
}

export const PURCHASE: OrderConfig = {
  base: '/purchase-orders',
  route: '/purchase',
  title: '採購單',
  partyKey: 'supplier',
  partyIdKey: 'supplierId',
  partyEndpoint: '/suppliers',
  partyLabel: '供應商',
  writePerm: 'purchase:write',
  approvePerm: 'purchase:approve',
  fulfillPerm: 'purchase:receive',
  approveAction: 'approve',
  approveLabel: '核准',
  fulfillAction: 'receive',
  fulfillLabel: '收貨',
  doneKey: 'receivedQty',
  doneLabel: '已收',
  priceKey: 'cost',
};

export const SALES: OrderConfig = {
  base: '/sales-orders',
  route: '/sales',
  title: '銷售單',
  partyKey: 'customer',
  partyIdKey: 'customerId',
  partyEndpoint: '/customers',
  partyLabel: '客戶',
  writePerm: 'sales:write',
  approvePerm: 'sales:confirm',
  fulfillPerm: 'sales:ship',
  approveAction: 'confirm',
  approveLabel: '確認訂單',
  fulfillAction: 'ship',
  fulfillLabel: '出貨',
  doneKey: 'shippedQty',
  doneLabel: '已出',
  priceKey: 'price',
};
