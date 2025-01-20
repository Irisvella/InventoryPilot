import React, { useState } from "react";
import Header from "../dashboard_sidebar/Header";
// import Sidebar from "../dashboard_sidebar/Sidebar";
import { useNavigate } from "react-router-dom";
import SideBar from "../dashboard_sidebar1/App";

const Dashboard = ({ userData }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-dvh w-full">
    <SideBar /> {/* Add the SideBar component here */}

      {/* Main Content */}
      <div className="flex-1 sm:ml-10 sm:mt-10">
      
        {/* Page Content */}
        <main className="p-4 mt-16 bg-gray-100 ">
          <h1 className="text-2xl font-semibold">This is the {userData?.role} dashboard</h1>
          <h2>Welcome, {userData?.first_name || "User"}!</h2>

          {userData ? (
            <div>
              <p>Username: {userData.username}</p>
              <p>Email: {userData.email}</p>
              <p>Role: {userData.role}</p>
              <p>First Name: {userData.first_name}</p>
              <p>Last Name: {userData.last_name}</p>
              <p>Department: {userData.department}</p>
            </div>
          ) : (
            <p>Error</p>
          )}
          {/* <p className="mt-4 text-gray-700">
            This is where your main content will go.This is the default dashboard. Do you have a role?</p>
            <button type='button' onClick={handleLogout}>Log Out</button> */}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
