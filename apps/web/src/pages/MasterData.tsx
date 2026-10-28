import { Column } from '../components/DataTable';
import { CrudPage, FieldDef } from '../components/CrudPage';
import { ActiveBadge } from '../components/StatusBadge';
import { useOptions } from '../hooks/useOptions';
import { money, qty } from '../lib/format';

type Row = { id: string } & Record<string, any>;

const activeCol: Column<Row> = {
  key: 'active',
  label: '狀態',
  render: (r) => <ActiveBadge active={r.active} />,
};

export function ProductsPage() {
  const { options } = useOptions<Row>('/categories', (c) => c.name);
  const fields: FieldDef[] = [
    { name: 'sku', label: '料號', required: true, createOnly: true },
    { name: 'name', label: '品名', required: true },
    { name: 'categoryId', label: '分類', type: 'select', options },
    { name: 'unit', label: '單位' },
    { name: 'price', label: '售價', type: 'number', required: true },
    { name: 'reorderPoint', label: '安全庫存', type: 'number' },
    { name: 'active', label: '啟用', type: 'checkbox', editOnly: true },
  ];
  return (
    <CrudPage<Row>
      title="商品"
      endpoint="/products"
      readPerm="product:read"
      writePerm="product:write"
      fields={fields}
      columns={[
        { key: 'sku', label: '料號' },
        { key: 'name', label: '品名' },
        { key: 'category', label: '分類', render: (r) => r.category?.name ?? '' },
        { key: 'unit', label: '單位' },
        { key: 'price', label: '售價', align: 'right', render: (r) => money(r.price) },
        { key: 'cost', label: '成本', align: 'right', render: (r) => money(r.cost) },
        { key: 'reorderPoint', label: '安全庫存', align: 'right', render: (r) => qty(r.reorderPoint) },
        activeCol,
      ]}
    />
  );
}

export function CategoriesPage() {
  const { options } = useOptions<Row>('/categories', (c) => c.name);
  return (
    <CrudPage<Row>
      title="商品分類"
      endpoint="/categories"
      readPerm="product:read"
      writePerm="product:write"
      paged={false}
      fields={[
        { name: 'name', label: '名稱', required: true },
        { name: 'parentId', label: '上層分類', type: 'select', options },
      ]}
      columns={[
        { key: 'name', label: '名稱' },
        { key: 'count', label: '商品數', align: 'right', render: (r) => r._count?.products ?? 0 },
      ]}
    />
  );
}

export function WarehousesPage() {
  return (
    <CrudPage<Row>
      title="倉庫"
      endpoint="/warehouses"
      readPerm="warehouse:read"
      writePerm="warehouse:write"
      paged={false}
      fields={[
        { name: 'code', label: '代碼', required: true, createOnly: true },
        { name: 'name', label: '名稱', required: true },
        { name: 'address', label: '地址' },
        { name: 'active', label: '啟用', type: 'checkbox', editOnly: true },
      ]}
      columns={[
        { key: 'code', label: '代碼' },
        { key: 'name', label: '名稱' },
        { key: 'address', label: '地址' },
        activeCol,
      ]}
    />
  );
}

const partyFields = (credit: boolean): FieldDef[] => [
  { name: 'code', label: '代碼', required: true, createOnly: true },
  { name: 'name', label: '名稱', required: true },
  { name: 'contact', label: '聯絡人' },
  { name: 'phone', label: '電話' },
  { name: 'email', label: '電子郵件', type: 'email' },
  { name: 'taxId', label: '統一編號' },
  { name: 'address', label: '地址' },
  { name: 'termDays', label: '付款天數', type: 'number', step: '1' },
  ...(credit ? [{ name: 'creditLimit', label: '信用額度', type: 'number' } as FieldDef] : []),
  { name: 'active', label: '啟用', type: 'checkbox', editOnly: true },
];

const partyColumns = (credit: boolean): Column<Row>[] => [
  { key: 'code', label: '代碼' },
  { key: 'name', label: '名稱' },
  { key: 'contact', label: '聯絡人' },
  { key: 'phone', label: '電話' },
  { key: 'termDays', label: '付款天數', align: 'right' },
  ...(credit
    ? [{ key: 'creditLimit', label: '信用額度', align: 'right', render: (r: Row) => money(r.creditLimit) } as Column<Row>]
    : []),
  activeCol,
];

export function CustomersPage() {
  return (
    <CrudPage<Row>
      title="客戶"
      endpoint="/customers"
      readPerm="customer:read"
      writePerm="customer:write"
      fields={partyFields(true)}
      columns={partyColumns(true)}
    />
  );
}

export function SuppliersPage() {
  return (
    <CrudPage<Row>
      title="供應商"
      endpoint="/suppliers"
      readPerm="supplier:read"
      writePerm="supplier:write"
      fields={partyFields(false)}
      columns={partyColumns(false)}
    />
  );
}
