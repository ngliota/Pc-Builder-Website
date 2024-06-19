import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081', // Adjust baseURL based on your backend setup
  withCredentials: true,
});

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    isLoading: true,
    userid: null,
  });

  useEffect(() => {
    const checkLoggedInStatus = async () => {
      try {
        const response = await axiosInstance.get('/check-auth');
        if (response.status === 200 && response.data.message === 'Logged in') {
          setAuthState({
            isLoggedIn: true,
            isLoading: false,
            userid: response.data.user ? response.data.user.userid : null,
          });
        } else {
          setAuthState({
            isLoggedIn: false,
            isLoading: false,
            userid: null,
          });
        }
      } catch (error) {
        console.error('Error checking logged in status:', error);
        setAuthState({
          isLoggedIn: false,
          isLoading: false,
          userid: null,
        });
      }
    };

    checkLoggedInStatus();
  }, []);

  const setUserId = (userid) => {
    setAuthState((prevState) => ({
      ...prevState,
      userid: userid,
    }));
  };

  const login = async (username, password) => {
    try {
      const response = await axiosInstance.post('/login', { username, password });
      if (response.status === 200) {
        console.log('Logged in successfully. User ID:', response.data.user.userid); // Log userid here
        setAuthState({
          isLoggedIn: true,
          isLoading: false,
          userid: response.data.user.userid,
        });
      } else {
        console.error('Login failed');
        setAuthState({
          isLoggedIn: false,
          isLoading: false,
          userid: null,
        });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setAuthState({
        isLoggedIn: false,
        isLoading: false,
        userid: null,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await axiosInstance.post('/logout');
      if (response.status === 200) {
        console.log('Logged out successfully');
        setAuthState({
          isLoggedIn: false,
          isLoading: false,
          userid: null,
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
      setAuthState({
        isLoggedIn: false,
        isLoading: false,
        userid: null,
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setUserId }}>
      {children}
    </AuthContext.Provider>
  );
};
