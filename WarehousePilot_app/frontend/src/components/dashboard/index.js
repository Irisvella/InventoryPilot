export { default as Dashboard } from './Dashboard';
export { default as AdminDashboard } from './AdminDashboard';
export { default as ManagerDashboard } from './ManagerDashboard';
export { default as AccountManagement } from './AccountManagement';
export { default as ChangePassword } from './ChangePassword';
export { default as Profile } from './Profile';
export { default as StaffDashboard } from './StaffDashboard';
import KpiDashboard from "./KpiDashboard";

const routes = [
  { path: "/kpi", component: KpiDashboard },
];

export default routes;