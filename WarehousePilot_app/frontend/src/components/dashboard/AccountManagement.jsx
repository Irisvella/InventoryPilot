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
      <div>
        {/* Sidebar */}
        <SideBar />
        <NavBar/>
        {/* Main Content */}
        <div className="flex-1 p-6">
        <div className="ml-4">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mt-8 lg:mt-14 mb-2">
              Account Management
            </h1>
            <p className="text-base lg:text-lg text-gray-600">
              This is the overview page where you can view your account details.
            </p>
          </div>

          {/* Information Section */}
          {userData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-700">Basic Information</h2>
                <p className="mt-2">
                  <strong>Username:</strong> {userData.username}
                </p>
                <p>
                  <strong>Email:</strong> {userData.email}
                </p>
                <p>
                  <strong>Role:</strong> {userData.role}
                </p>
              </div>

              {/* Personal Information */}
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>
                <p className="mt-2">
                  <strong>First Name:</strong> {userData.first_name}
                </p>
                <p>
                  <strong>Last Name:</strong> {userData.last_name}
                </p>
                <p>
                  <strong>Department:</strong> {userData.department}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Error loading user data.</p>
          )}

          {/* Action Button Section */}
          <div className="mt-6 flex justify-center lg:justify-start">
            <button
              type="button"
              className="px-6 py-3 text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition duration-300"
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
