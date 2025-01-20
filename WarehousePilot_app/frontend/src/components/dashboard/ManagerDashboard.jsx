import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './Dashboard';

function ManagerDashboard() {
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
          navigate('/'); // Redirect to login on error
        }
      } else {
        navigate('/'); // Redirect if no token
      }
    };
    fetchUserData();
  }, [navigate]);

  return (
    <div>
      <Dashboard userData={userData} />
    </div>
  );
}

export default ManagerDashboard;











// // the "main page" of the managerdashboard. First thing they see when logging in.
// // route: /manager_dashboard

// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Dashboard from './Dashboard';

// function ManagerDashboard() {
//   const [userData, setUserData] = useState(null);
//   const navigate = useNavigate();


//   useEffect(() => {
//     const fetchUserData = async () => {
//       const token = localStorage.getItem('token');
//       if (token) {
//         try {
//           const response = await axios.get('http://127.0.0.1:8000/manager_dashboard/profile/', {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           setUserData(response.data);
//         } catch (error) {
//           console.error('Error fetching user data:', error);
//         }
//       }
//     };
//     fetchUserData();
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     navigate('/');
//   };


//   return (
//     <div>
//       <Dashboard />
//       <h2>Manager Dashboard</h2>
//       {userData ? (
//         <div>
//           <p>Username: {userData.username}</p>
//           <p>Email: {userData.email}</p>
//           <p>Role: {userData.role}</p>
//           <p>First Name: {userData.first_name}</p>
//           <p>Last Name: {userData.last_name}</p>
//           <p>Department: {userData.department}</p>
//         </div>
//       ) : (
//         <p>Error</p>
//       )}
//     <button type='button' onClick={() => navigate('/account_management')}>Account Management</button>
//     <button type='button' onClick={handleLogout}>Log Out</button>
//     </div>
//   );
// }

// export default ManagerDashboard;