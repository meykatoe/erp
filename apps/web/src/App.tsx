import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { AccountsPage, InvoicesPage, JournalsPage, TrialBalancePage } from './pages/Accounting';
import { AuditPage, RolesPage, UsersPage } from './pages/Admin';
import { ChangePassword } from './pages/ChangePassword';
import { Dashboard } from './pages/Dashboard';
import { AttendancePage, DepartmentsPage, EmployeesPage, LeavesPage, PayrollPage } from './pages/Hr';
import { InventoryPage, MovementsPage } from './pages/Inventory';
import { Login } from './pages/Login';
import { CategoriesPage, CustomersPage, ProductsPage, SuppliersPage, WarehousesPage } from './pages/MasterData';
import { OrderDetailPage, OrderFormPage, OrderListPage } from './pages/Orders';
import { PURCHASE, SALES } from './pages/orders.config';
import { ReportsPage } from './pages/Reports';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">載入中…</p>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="password" element={<ChangePassword />} />

        <Route path="sales" element={<OrderListPage cfg={SALES} />} />
        <Route path="sales/new" element={<OrderFormPage cfg={SALES} />} />
        <Route path="sales/:id" element={<OrderDetailPage cfg={SALES} />} />
        <Route path="sales/:id/edit" element={<OrderFormPage cfg={SALES} />} />
        <Route path="customers" element={<CustomersPage />} />

        <Route path="purchase" element={<OrderListPage cfg={PURCHASE} />} />
        <Route path="purchase/new" element={<OrderFormPage cfg={PURCHASE} />} />
        <Route path="purchase/:id" element={<OrderDetailPage cfg={PURCHASE} />} />
        <Route path="purchase/:id/edit" element={<OrderFormPage cfg={PURCHASE} />} />
        <Route path="suppliers" element={<SuppliersPage />} />

        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/movements" element={<MovementsPage />} />

        <Route path="accounting/invoices" element={<InvoicesPage />} />
        <Route path="accounting/journals" element={<JournalsPage />} />
        <Route path="accounting/accounts" element={<AccountsPage />} />
        <Route path="accounting/trial-balance" element={<TrialBalancePage />} />

        <Route path="hr/employees" element={<EmployeesPage />} />
        <Route path="hr/departments" element={<DepartmentsPage />} />
        <Route path="hr/attendance" element={<AttendancePage />} />
        <Route path="hr/leaves" element={<LeavesPage />} />
        <Route path="hr/payroll" element={<PayrollPage />} />

        <Route path="reports" element={<ReportsPage />} />

        <Route path="admin/users" element={<UsersPage />} />
        <Route path="admin/roles" element={<RolesPage />} />
        <Route path="admin/audit" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
