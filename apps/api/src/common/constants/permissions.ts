export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  ROLE_READ: 'role:read',
  ROLE_WRITE: 'role:write',
  AUDIT_READ: 'audit:read',
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  WAREHOUSE_READ: 'warehouse:read',
  WAREHOUSE_WRITE: 'warehouse:write',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_WRITE: 'customer:write',
  SUPPLIER_READ: 'supplier:read',
  SUPPLIER_WRITE: 'supplier:write',
  PURCHASE_READ: 'purchase:read',
  PURCHASE_WRITE: 'purchase:write',
  PURCHASE_APPROVE: 'purchase:approve',
  PURCHASE_RECEIVE: 'purchase:receive',
  SALES_READ: 'sales:read',
  SALES_WRITE: 'sales:write',
  SALES_CONFIRM: 'sales:confirm',
  SALES_SHIP: 'sales:ship',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_ADJUST: 'inventory:adjust',
  ACCOUNTING_READ: 'accounting:read',
  ACCOUNTING_WRITE: 'accounting:write',
  HR_READ: 'hr:read',
  HR_WRITE: 'hr:write',
  PAYROLL_READ: 'payroll:read',
  PAYROLL_WRITE: 'payroll:write',
  REPORT_READ: 'report:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS);

const P = PERMISSIONS;

export const ROLE_PRESETS: Record<string, { description: string; permissions: string[] }> = {
  admin: { description: '系統管理員', permissions: ALL_PERMISSIONS },
  sales: {
    description: '業務',
    permissions: [
      P.CUSTOMER_READ,
      P.CUSTOMER_WRITE,
      P.PRODUCT_READ,
      P.SALES_READ,
      P.SALES_WRITE,
      P.SALES_CONFIRM,
      P.INVENTORY_READ,
      P.REPORT_READ,
    ],
  },
  purchaser: {
    description: '採購',
    permissions: [
      P.SUPPLIER_READ,
      P.SUPPLIER_WRITE,
      P.PRODUCT_READ,
      P.PURCHASE_READ,
      P.PURCHASE_WRITE,
      P.PURCHASE_APPROVE,
      P.INVENTORY_READ,
    ],
  },
  warehouse: {
    description: '倉管',
    permissions: [
      P.PRODUCT_READ,
      P.WAREHOUSE_READ,
      P.WAREHOUSE_WRITE,
      P.INVENTORY_READ,
      P.INVENTORY_ADJUST,
      P.PURCHASE_READ,
      P.PURCHASE_RECEIVE,
      P.SALES_READ,
      P.SALES_SHIP,
    ],
  },
  finance: {
    description: '財務',
    permissions: [
      P.ACCOUNTING_READ,
      P.ACCOUNTING_WRITE,
      P.PAYROLL_READ,
      P.PAYROLL_WRITE,
      P.REPORT_READ,
      P.PURCHASE_READ,
      P.SALES_READ,
    ],
  },
  hr: {
    description: '人資',
    permissions: [P.HR_READ, P.HR_WRITE, P.PAYROLL_READ],
  },
};
