import { Dashboard, ManagerDashboard, AdminDashboard, AccountManagement, ChangePassword, Profile, StaffDashboard  } from '../dashboard';
import KpiDashboard from "../dashboard/KpiDashboard"
import InventoryTable from '../inventory-stock/App'; 
import ManageUsersPage from '../admin_manage_users/ManageUsersPage';
import AddUsersDashboard from '../dashboard/AddUsersDashboard';
import NotifCard from '../notifications/notifications-card/App';
import NavBar from '../navbar/App';
import OrderListView from '../orders/OrderListView'; 
import ManageUsersTable from '../admin_manage_users/manage_users_table/App';
import InventoyPickList from '../orders/InventoyPickList';
import AssignedPickList from '../orders/AssignedPickList';
import InventoryPickListItem from '../orders/InventoryPickListItem';
import InventoryAndManufacturingList from '../orders/InventoryAndManufacturingList';
import ManufacturingListItem from '../orders/ManufacturingListItem';
import StaffManufacturingTasks from '../manufacturing/StaffManufacturingTasks';



export const dashboard_routes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/manager_dashboard', element: <ManagerDashboard /> },
  { path: '/admin_dashboard', element: <AdminDashboard /> },
  { path: '/admin_dashboard/manage_users', element: <ManageUsersTable /> },
  { path: '/account_management', element: <AccountManagement /> },
  { path: '/profile', element: <Profile /> },
  { path: '/kpi', element: <KpiDashboard /> },
  { path: '/change_password', element: <ChangePassword /> },
  { path: '/inventory-stock', element: <InventoryTable /> },
  { path: '/admin_dashboard/add_users', element: <AddUsersDashboard />},
  { path: '/navbar', element: <NavBar /> },
  { path: '/admin_dashboard/edit_user/:user_id', element: <AddUsersDashboard />},
  { path: '/admin_dashboard/add_users', element: <AddUsersDashboard />},
  { path: '/orders', element: <OrderListView /> },
  { path: '/inventory_pick_list', element: <InventoyPickList /> },
  { path: '/staff_dashboard', element: <StaffDashboard /> },
  { path: '/assigned_picklist', element: <AssignedPickList /> },
  { path: '/inventory_and_manufacturing_picklist', element: <InventoryAndManufacturingList /> },
  { path: '/inventory_picklist_items/:order_id', element: <InventoryPickListItem /> },
  { path: '/manufacturing_list_item/:order_id', element: <ManufacturingListItem /> },
  { path: '/staff_manufacturing_tasks', element: <StaffManufacturingTasks /> }
]
