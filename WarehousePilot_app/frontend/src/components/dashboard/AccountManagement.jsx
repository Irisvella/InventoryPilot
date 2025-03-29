import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NavBar from "../navbar/App";
import SideBar from "../dashboard_sidebar1/App";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function AccountManagement() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserData(response.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, []);

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
              Account Management
            </h1>
            <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">
              This is the overview page where you can view your account details.
            </p>
          </div>

          {/* Information Section */}
          {userData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Basic Information
                </h2>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Username:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{userData.username}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{userData.email}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Role:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white capitalize">{userData.role}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button Section */}
          <div className="mt-6 flex justify-center lg:justify-start">
            <button
              type="button"
              className="px-6 py-3 text-white bg-black dark:bg-gray-700 rounded-lg shadow transition duration-300 hover:bg-gray-800 dark:hover:bg-gray-600"
              onClick={() => navigate("/change_password")}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountManagement;