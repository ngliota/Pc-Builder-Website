import React, { useContext } from 'react';
import './header.css';
import ME from '../../assets/pcreal.png';
import HeaderSocials from './HeaderSocials';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const Header = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/simulation'); // Redirect to /simulation if logged in
    } else {
      navigate('/signup'); // Redirect to /signup if not logged in
    }
  };

  return (
    <header>
      <div className="container header__container">
        <h5>Welcome</h5>
        <h1>Note, plan, build, play</h1>
        <h5 className="text-light">PC Builder Website</h5>
        <div className='cta'>
          <button onClick={handleGetStarted} className='btn btn-primary'>
            {isLoggedIn ? "Simulate Now" : "Get Started"}
          </button>
        </div>
        <HeaderSocials />
        <div className="me">
          <img src={ME} alt="me" />
        </div>
        <a href='#contact' className='scroll__down'>Contact Us</a>
      </div>
    </header>
  );
}

export default Header;
