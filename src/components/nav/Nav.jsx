import React, { useContext } from 'react';
import './nav.css';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const axiosInstance = axios.create({
  withCredentials: true,
});

const Nav = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axiosInstance.post('http://localhost:8081/logout');
      if (response.status === 200) {
        setIsLoggedIn(false); // Update isLoggedIn state on successful logout
        navigate('/login'); // Redirect to login page after logout
      } else {
        console.error('Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const scrollToElement = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="futuristic-nav">
      <div className="nav-container">
        <div className="nav-links">
          <Link to="/home#" onClick={() => scrollToElement('home')} className="nav-link">Home</Link>
          <Link to="/home#about" onClick={() => scrollToElement('about')} className="nav-link">About</Link>
          <Link to="/home#experience" onClick={() => scrollToElement('experience')} className="nav-link">Roadmap</Link>
          <Link to="/home#contact" onClick={() => scrollToElement('contact')} className="nav-link">Contact</Link>
          {isLoggedIn && <Link to="/simulation" onClick={() => scrollToElement('simulation')} className="nav-link">Simulation</Link>}
          {isLoggedIn && <Link to="/history" className="nav-link">History</Link>}
        </div>
        <div className="auth-options">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="btn btn-primary">Logout</button>
          ) : (
            <Link to="/login" className="btn btn-primary">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Nav;
