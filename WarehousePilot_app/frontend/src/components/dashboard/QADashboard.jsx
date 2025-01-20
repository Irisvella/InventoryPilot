import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './Dashboard';

function QADashboard() {
  const [userData, setUserData] = useState(null);
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
      } else {
        navigate('/login'); // Redirect to login if token is missing
      }
    };
    fetchUserData();
  }, [navigate]);

  return (
    <div>
      <Dashboard userData={userData} />
      <h1>Hello QA Dashboard</h1>
    </div>
  );
}

export default QADashboard;
