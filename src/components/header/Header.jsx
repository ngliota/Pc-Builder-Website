import React from 'react'
import './header.css'
import CTA from './CTA'
import ME from '../../assets/pcreal.png'
import HeaderSocials from './HeaderSocials'
import {Link} from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <div className="container header__container">
        <h5>Welcome</h5>
        <h1>Note, plan, build, play</h1>
        <h5 className="text-light">PC Builder Website</h5>
        <div className='cta'>
      <Link to="/simulation" className='btn btn-primary'>Get Started</Link>
      </div>
      <HeaderSocials />

      <div className="me">
        <img src={ME} alt="me" />
      </div>
      
      <a href='#contact' className='scroll__down'>Contact Us</a>
      </div>
    </header>
  )
}

export default Header

