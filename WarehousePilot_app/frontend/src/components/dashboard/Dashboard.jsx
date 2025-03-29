import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../dashboard_sidebar1/App";
import NavBar from "../navbar/App";

const Dashboard = ({ userData, darkMode }) => {
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
    <div className= {darkMode ? 'dark' : ''}> 
    <SideBar darkMode={darkMode} /> {/* Add the SideBar component here */}
    

      {/* Main Content */}
      <div className="flex-1 sm:ml-10 sm:mt-8">
      <NavBar darkMode={darkMode}/>
        {/* Page Content */}
        <main className={`p-4 mt-16 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
          <h1 className="text-2xl font-semibold">This is the {userData?.role} dashboard</h1>
          <h2>Welcome, {userData?.first_name || "User"}!</h2>
          
          {userData ? (
            <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;