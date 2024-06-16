// src/components/signup/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Form, Input, Button, Title, Link } from '../login/styles';

const axiosInstance = axios.create({
  withCredentials: true,
});

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log('Signup attempt:', { username, password });

    try {
      const response = await axiosInstance.post('http://localhost:8081/signup', { username, password });
      console.log('Response from server:', response.data);

      if (response.data && response.data.message === 'Signup successful') {
        navigate('/login');
      } else {
        alert('Signup failed');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSignup}>
        <Title>Sign Up</Title>
        <label>
          Username:
          <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password:
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <Button type="submit">Sign Up</Button>
        <Link onClick={() => navigate('/login')}>Already have an account? Log in</Link>
      </Form>
    </Container>
  );
};

export default Signup;
