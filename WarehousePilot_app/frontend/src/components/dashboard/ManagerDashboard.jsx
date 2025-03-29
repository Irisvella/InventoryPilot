import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from "../navbar/App";
import SideBar from "../dashboard_sidebar1/App";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ManagerDashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserData(response.data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dark:bg-gray-900 min-h-screen">
      {/* Sidebar */}
      <SideBar />
      <NavBar />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="ml-4">
          {/* Header Section */}
          <div className="mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mt-2 lg:mt-4 mb-2">
              Welcome, {userData ? userData.first_name : "..."}!
            </h1>
          </div>

          {/* Information Section */}
          {userData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Personal Information
                </h2>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-400">First Name:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{userData.first_name}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Last Name:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{userData.last_name}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Department:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{userData.department}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="mt-6 flex justify-center lg:justify-start">
            <button
              className="px-6 py-3 text-white bg-black dark:bg-gray-700 rounded-lg shadow transition duration-300 hover:bg-gray-800 dark:hover:bg-gray-600"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;