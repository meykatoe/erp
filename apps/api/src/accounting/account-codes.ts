export const ACCOUNT = {
  CASH: '1000',
  AR: '1100',
  INVENTORY: '1200',
  AP: '2100',
  WITHHOLDING: '2200',
  CAPITAL: '3100',
  REVENUE: '4100',
  COGS: '5100',
  INVENTORY_DIFF: '5200',
  SALARY: '6100',
} as const;

export const DEFAULT_ACCOUNTS: { code: string; name: string; type: string }[] = [
  { code: '1000', name: '現金及銀行存款', type: 'ASSET' },
  { code: '1100', name: '應收帳款', type: 'ASSET' },
  { code: '1200', name: '存貨', type: 'ASSET' },
  { code: '2100', name: '應付帳款', type: 'LIABILITY' },
  { code: '2200', name: '代扣款項', type: 'LIABILITY' },
  { code: '3100', name: '股本', type: 'EQUITY' },
  { code: '4100', name: '銷貨收入', type: 'REVENUE' },
  { code: '5100', name: '銷貨成本', type: 'EXPENSE' },
  { code: '5200', name: '存貨盤盈虧', type: 'EXPENSE' },
  { code: '6100', name: '薪資費用', type: 'EXPENSE' },
];
