import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await axios.get('http://localhost:8081/admin');
        if (response.data.message === 'Logged in') {
          setLoggedIn(true);
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    };
    checkLogin();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8081/logout');
      navigate('/login');
    } catch (error) {
      alert('Error logging out');
    }
  };

  return loggedIn ? (
    <div>
      <h2>Admin Page</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  ) : null;
};

export default Admin;
