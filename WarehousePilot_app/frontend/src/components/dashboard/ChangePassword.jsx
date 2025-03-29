import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SideBar from "../dashboard_sidebar1/App";
import NavBar from "../navbar/App";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(password)
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.get(`${API_BASE_URL}/auth/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) {
      setError('Password does not meet requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.post(
          `${API_BASE_URL}/auth/change_password/`,
          {
            old_password: oldPassword,
            new_password: newPassword,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSuccess('Password changed successfully.');
        setError('');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        setError('Error changing password. Please try again.');
        setSuccess('');
      }
    }
  };

  return (
    <div className="flex  dark:bg-gray-900 min-h-screen ">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Navbar */}
        <NavBar />

        {/* Page Content */}
        <div className="p-8 mt-2 ml-2 max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Change Password</h1>
            <p className="text-gray-500 dark:text-gray-400 text-base">
              Please enter your current password and set a new one below.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handlePasswordChange} className="w-full">
            {/* Old Password */}
            <div className="mb-5">
              <label htmlFor="old-password" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Old Password:
              </label>
              <input
                type="password"
                id="old-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Enter your old password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* New Password */}
            <div className="mb-5">
              <label htmlFor="new-password" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                New Password:
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => { 
                  setNewPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                required
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Password must contain: </p>
                <ul className="list-disc pl-5">  
                  <li className={passwordRequirements.length ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}>
                    At least 8 characters long
                  </li>
                  <li className={passwordRequirements.uppercase ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}>
                    At least one uppercase letter (A-Z)
                  </li> 
                  <li className={passwordRequirements.lowercase ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}>
                    At least one lowercase letter (a-z) 
                  </li>
                  <li className={passwordRequirements.number ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}>
                    At least one number (0-9)
                  </li>
                  <li className={passwordRequirements.special ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}>
                    At least one special character (!@#$%^&*()_-+=[]{}|;:,.?)
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="mb-5">
              <label htmlFor="confirm-new-password" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Confirm New Password:
              </label>
              <input
                type="password"
                id="confirm-new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Feedback Messages */}
            {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 dark:text-green-400 text-sm mb-4">{success}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-black dark:bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition duration-200"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;