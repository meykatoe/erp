import { Column } from '../components/DataTable';
import { CrudPage, FieldDef } from '../components/CrudPage';
import { StatusBadge } from '../components/StatusBadge';
import { useOptions } from '../hooks/useOptions';
import { money, qty } from '../lib/format';

type Row = { id: string } & Record<string, any>;

const activeCol: Column<Row> = {
  key: 'active',
  label: '狀態',
  render: (r) => <StatusBadge status={r.active ? 'ACTIVE' : 'RESIGNED'} />,
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
