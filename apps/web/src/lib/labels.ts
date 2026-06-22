export const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  APPROVED: '已核准',
  PARTIALLY_RECEIVED: '部分收貨',
  RECEIVED: '已收貨',
  CONFIRMED: '已確認',
  PARTIALLY_SHIPPED: '部分出貨',
  SHIPPED: '已出貨',
  CANCELLED: '已取消',
  UNPAID: '未收付',
  PARTIAL: '部分收付',
  PAID: '已結清',
  VOID: '作廢',
  ACTIVE: '在職',
  ON_LEAVE: '留職停薪',
  RESIGNED: '離職',
  PENDING: '待審核',
  REJECTED: '已駁回',
  NORMAL: '正常',
  LATE: '遲到',
  ABSENT: '缺勤',
  POSTED: '已過帳',
  REVERSED: '已沖銷',
};

export const MOVEMENT_LABEL: Record<string, string> = {
  PURCHASE_IN: '採購入庫',
  SALES_OUT: '銷貨出庫',
  ADJUST_IN: '盤盈',
  ADJUST_OUT: '盤虧',
  TRANSFER_IN: '調入',
  TRANSFER_OUT: '調出',
};

export const LEAVE_LABEL: Record<string, string> = {
  ANNUAL: '特休',
  SICK: '病假',
  PERSONAL: '事假',
  OTHER: '其他',
};

export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  ASSET: '資產',
  LIABILITY: '負債',
  EQUITY: '權益',
  REVENUE: '收入',
  EXPENSE: '費用',
};
