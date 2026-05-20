import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface Item {
  to: string;
  label: string;
  perm?: string;
}

const NAV: { group: string; items: Item[] }[] = [
  { group: '總覽', items: [{ to: '/', label: '儀表板' }] },
  {
    group: '銷售',
    items: [
      { to: '/sales', label: '銷售單', perm: 'sales:read' },
      { to: '/customers', label: '客戶', perm: 'customer:read' },
    ],
  },
  {
    group: '採購',
    items: [
      { to: '/purchase', label: '採購單', perm: 'purchase:read' },
      { to: '/suppliers', label: '供應商', perm: 'supplier:read' },
    ],
  },
  {
    group: '庫存',
    items: [
      { to: '/products', label: '商品', perm: 'product:read' },
      { to: '/categories', label: '商品分類', perm: 'product:read' },
      { to: '/warehouses', label: '倉庫', perm: 'warehouse:read' },
      { to: '/inventory', label: '庫存查詢', perm: 'inventory:read' },
      { to: '/inventory/movements', label: '異動紀錄', perm: 'inventory:read' },
    ],
  },
  {
    group: '財務',
    items: [
      { to: '/accounting/invoices', label: '應收應付', perm: 'accounting:read' },
      { to: '/accounting/journals', label: '傳票', perm: 'accounting:read' },
      { to: '/accounting/accounts', label: '會計科目', perm: 'accounting:read' },
      { to: '/accounting/trial-balance', label: '試算表', perm: 'accounting:read' },
    ],
  },
  {
    group: '人事',
    items: [
      { to: '/hr/employees', label: '員工', perm: 'hr:read' },
      { to: '/hr/departments', label: '部門', perm: 'hr:read' },
      { to: '/hr/attendance', label: '考勤', perm: 'hr:read' },
      { to: '/hr/leaves', label: '請假', perm: 'hr:read' },
      { to: '/hr/payroll', label: '薪資', perm: 'payroll:read' },
    ],
  },
  { group: '報表', items: [{ to: '/reports', label: '營運報表', perm: 'report:read' }] },
  {
    group: '系統',
    items: [
      { to: '/admin/users', label: '使用者', perm: 'user:read' },
      { to: '/admin/roles', label: '角色權限', perm: 'role:read' },
      { to: '/admin/audit', label: '稽核紀錄', perm: 'audit:read' },
    ],
  },
];

export function Layout() {
  const { user, logout, can } = useAuth();

  return (
    <div className="shell">
      <aside>
        <div className="brand">ERP</div>
        <nav>
          {NAV.map((g) => {
            const items = g.items.filter((i) => !i.perm || can(i.perm));
            if (items.length === 0) return null;
            return (
              <div key={g.group} className="nav-group">
                <div className="nav-title">{g.group}</div>
                {items.map((i) => (
                  <NavLink key={i.to} to={i.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
                    {i.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>{user?.name}</span>
          <NavLink to="/password">修改密碼</NavLink>
          <button onClick={logout}>登出</button>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
