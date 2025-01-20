// First screen of the application
// route: / 
// Logs in and redirects to their dashboard according to their role. 

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './authentication.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/auth/login/', { username, password });
      console.log('Login response:', response.data); // Log the entire response


      const { access, user } = response.data; 
      console.log('User:', user); // Log the user object to see its structure
      localStorage.setItem('token', access);
      localStorage.setItem('user', JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin_dashboard');
      } else if (user.role === 'manager') {
        navigate('/manager_dashboard');
      } else if (user.role === 'staff') {
        navigate('/staff_dashboard');
      } else if (user.role === 'qa') {
        navigate('/qa_dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-header">
          <img src="csf-logo-footer.png" alt="Company Logo" className="logo" />
          <h1>Sign In</h1>
        </div>
        <form onSubmit={handleLogin} className={`login-form ${shake ? 'shake' : ''}`}>          <label className="form-label">
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter Username"
              className="form-input"
            />
          </label>
          <label className="form-label">
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              className="form-input"
            />
          </label>
          <div className="form-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              /> Remember me
            </label>
            <a href="#" className="forgot-password">I forgot my password</a>
          </div>
          <button type="submit" className="login-button">Sign In</button>
          {error && <p className="error-message" data-testid="login-error">{error}</p>}
        </form>
      </div>
      <div className="login-right">
        <img src="sign-in-img1.png" alt="Worker with laptop" className="login-image" />
      </div>
    </div>
  );
}

export default Login;