import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './signup.css'; // Import CSS file for styles
import { AuthContext } from '../../contexts/AuthContext'; // Import AuthContext

const axiosInstance = axios.create({
  withCredentials: true,
});

const Signup = () => {
  const { setUserId } = useContext(AuthContext); // Use AuthContext to get setUserId
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State to track loading state
  const [signupSuccess, setSignupSuccess] = useState(false); // State to track signup success
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state to true during signup attempt
    console.log('Signup attempt:', { username, password });

    try {
      const response = await axiosInstance.post('https://backend.agungyzs.site/signup', { username, password });
      console.log('Response from server:', response.data);

      if (response.data && response.data.message === 'Signup successful') {
        const { userid } = response.data; // Extract userid from response
        setUserId(userid); // Store userid in application state
        setSignupSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 1000); // Redirect to login after 1 second
      } else {
        alert('Signup failed');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setLoading(false); // Set loading state back to false after signup attempt completes
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSignup}>
        <h2>Sign Up</h2>
        <label>
          Username:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="signup-input" />
        </label>
        <label>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="signup-input" />
        </label>
        <button type="submit" className="signup-button" disabled={loading}>
          {loading ? 'Signing up...' : signupSuccess ? 'Signed Up' : 'Sign Up'}
        </button>
        <a className="login-link" onClick={() => navigate('/login')}>Already have an account? Log in</a>
      </form>
    </div>
  );
};

export default Signup;
