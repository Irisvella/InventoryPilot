// route: change_password
// Checks old password and takes a new one. Changes the password in the database.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../dashboard_sidebar/Sidebar';
import Header from '../dashboard_sidebar/Header';

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/auth/profile/', {
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

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.post('http://127.0.0.1:8000/auth/change_password/', {
          old_password: oldPassword,
          new_password: newPassword,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Password changed successfully');
        setError('');
      } catch (error) {
        setError('Error changing password');
        setSuccess('');
      }
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar userData={userData} isOpen={isSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 sm:ml-64">
        {/* Navbar */}
        <Header userData={userData} toggleSidebar={toggleSidebar} />
        {/* Page Content */}
        <main className="p-4 mt-16 bg-gray-100">
          <h1>Change Password</h1>
          <form onSubmit={handlePasswordChange} className='max-w-md'>
            <div className="mb-4">
              <label htmlFor='old-password' className="block text-gray-700">Old Password:</label>
              <input
                type="password"
                id='old-password'
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor='new-password' className="block text-gray-700">New Password:</label>
              <input
                type="password"
                id='new-password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor='confirm-new-password' className="block text-gray-700">Confirm New Password:</label>
              <input
                type="password"
                id='confirm-new-password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
            <button
              type="submit"
              className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-700"
            >
              Change Password
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

export default ChangePassword;