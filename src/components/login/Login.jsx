import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext'; // Adjust the path based on your project structure
import './login.css'; // Import CSS file for styles

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State to track loading state
  const navigate = useNavigate();
  const { login, userid } = useContext(AuthContext); // Get login function and userid from AuthContext

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state to true during login attempt

    try {
      await login(username, password); // Call login function from context
      // Optionally, you can redirect to a different page based on the user's role or default to /home
      navigate('/home'); // Redirect to home after successful login
    } catch (error) {
      console.error('Error logging in:', error);
      if (error.response && error.response.status === 401) {
        alert('Invalid username or password');
      } else {
        alert('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false); // Set loading state back to false after login attempt completes
    }
  };

  // Redirect to signup page
  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
        </label>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <a className="signup-link" onClick={handleSignup}>
          Don't have an account? Sign up
        </a>
      </form>
    </div>
  );
};

export default Login;
