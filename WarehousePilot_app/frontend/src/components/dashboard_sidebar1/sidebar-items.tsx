import {Icon} from "@iconify/react";
import {type SidebarItem} from "./sidebar";

const user = localStorage.getItem('user');
const parsedUser = user ? JSON.parse(user) : null;
const userRole = parsedUser ? parsedUser.role : null;
console.log('user from local storage', parsedUser);

export const items: SidebarItem[] = [
  {
    key: "dashboard",
    href: userRole === 'admin' ? "/admin_dashboard" : "/manager_dashboard",
    icon: "solar:home-2-linear",
    title: "Dashboard",
},
  {
    key: "kpi",
    href: "/kpi", 
    icon: "solar:chart-outline",
    title: "KPI",
  },
  {
    key: "orders",
    href: "/orders",
    icon: "solar:clipboard-list-linear",
    title: "Orders",
  },
  {
    key: "production_plan",
    href: "/sidebar",
    icon: "solar:calendar-outline",
    title: "Production Plan",
  },
  {
    key: "staff_assigned_tasks",
    href: "/staff_manufacturing_tasks",
    icon: "solar:bill-list-outline",
    title: "Assigned tasks",
  },
  {
    key: "inventory",
    href: "/inventory-stock",
    icon: "solar:box-outline",
    title: "Inventory",
  },
  {
    key: "account_management",
    href: "/account_management",
    icon: "solar:user-outline",
    title: "Account Management",
  },
  {
    key: "assigned_picklist",
    href: "/assigned_picklist",
    icon: "solar:clipboard-list-outline",
    title: "My Assigned Picklist",
  },
];


export default items;