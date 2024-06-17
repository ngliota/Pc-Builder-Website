import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081', // Adjust baseURL based on your backend setup
  withCredentials: true,
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userid, setUserid] = useState(null);

  useEffect(() => {
    const checkLoggedInStatus = async () => {
      try {
        const response = await axiosInstance.get('/check-auth');
        if (response.data.loggedIn) {
          setIsLoggedIn(true);
          setUserid(response.data.userid);
        } else {
          setIsLoggedIn(false);
          setUserid(null);
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserid(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedInStatus();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axiosInstance.post('/login', { username, password });
      if (response.status === 200) {
        setIsLoggedIn(true);
        setUserid(response.data.userid);
      } else {
        setIsLoggedIn(false);
        setUserid(null);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setUserid(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await axiosInstance.post('/logout');
      if (response.status === 200) {
        setIsLoggedIn(false);
        setUserid(null);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setUserid(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, userid, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
