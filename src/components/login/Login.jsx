// src/components/login/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Form, Input, Button, Title, Link } from './styles';

const axiosInstance = axios.create({
  withCredentials: true,
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login attempt:', { username, password });

    try {
      const response = await axiosInstance.post('http://localhost:8081/login', { username, password });
      console.log('Response from server:', response.data);

      if (response.data && response.data.message === 'Login successful') {
        navigate('/admin');
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <Container>
      <Form onSubmit={handleLogin}>
        <Title>Login</Title>
        <label>
          Username:
          <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password:
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <Button type="submit">Login</Button>
        <Link onClick={() => navigate('/signup')}>Don't have an account? Sign up</Link>
      </Form>
    </Container>
  );
};

export default Login;
