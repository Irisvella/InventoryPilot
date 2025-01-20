import {DangerCircleSvg} from "./danger-circle";
import {DefaultCircleSvg} from "./default-circle";
import {SuccessCircleSvg} from "./success-circle";
import {WarningCircleSvg} from "./warning-circle";
import axios from "axios";
import { toast } from "react-toastify";

export const statusOptions = [
  {name: "Active", uid: "active"},
  {name: "Inactive", uid: "inactive"},
  {name: "Paused", uid: "paused"},
  {name: "Vacation", uid: "vacation"},
] as const;

export type StatusOptions = (typeof statusOptions)[number]["name"];

export const statusColorMap: Record<StatusOptions, JSX.Element> = {
  Active: SuccessCircleSvg,
  Inactive: DefaultCircleSvg,
  Paused: DangerCircleSvg,
  Vacation: WarningCircleSvg,
};

export const roleOptions = [
  {name: "All", uid: "all"},
  {name: "Manager", uid: "manager"},
  {name: "Admin", uid: "admin"},
] as const;

export const departmentOptions = [
  {name: "All", uid: "all"},
  {name: "IT", uid: "it"},  
] as const;

export type UserInfo = {
  avatar: string;
  email: string;
  name: string;
};

export type Users = {
  user_id: number;
  first_name: string;
  last_name: string;
  staffID: string;
  email: string;
  role: string;
  department: string;
};

export type ColumnsKey =
  | "first_name"
  | "last_name"
  | "staffID"
  | "email"
  | "role"
  | "department"
  | "actions";

export const INITIAL_VISIBLE_COLUMNS: ColumnsKey[] = [
  "first_name",
  "last_name",
  "staffID",
  "email",
  "role",
  "department",
  "actions",
];

export const columns = [
  {name: "First Name", uid: "first_name"},
  {name: "Last Name", uid: "last_name"},
  {name: "Staff ID", uid: "staffID"},
  {name: "Email", uid: "email"},
  {name: "Role", uid: "role"},
  {name: "Department", uid: "department"},
  {name: "Actions", uid: "actions"},
];

export const fetchUserInfo = async (): Promise<Users[]> => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/admin_dashboard/manage_users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (response.status !== 200) {
      throw new Error("Failed to fetch user info");
    }
    const data = response.data;
    if (!Array.isArray(data)) {
      throw new Error("Response data is not an array");
    }
    return data.map((item: any) => ({
      ...item,
      staffID: item.user_id,
    }));
  } catch (error) {
    console.error('Fetching user info failed:', error);
    throw error;
  }
};

// Handle delete action
export const deleteUser = async (user_id: number) => {
  try {
    const response = await axios.delete(`http://127.0.0.1:8000/admin_dashboard/delete_user/${user_id}/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    toast.success(response.data.message);
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    toast.error("Couldn't delete the user.");
    return false;
  }
};

// Confirm deletion action
export const confirmDelete = (user: Users, fetchUserInfo: () => void) => {
  if (window.confirm(`Are you sure you want to delete user ${user.first_name} ${user.last_name} with ID ${user.user_id}?`)) {
    deleteUser(user.user_id).then((success) => {
      if (success) {
        fetchUserInfo(); 
      }
    });
  }
};
