import React from 'react'
import './footer.css'
import {BsBack, BsInstagram} from 'react-icons/bs'
import {FaTwitterSquare} from 'react-icons/fa'

const Footer = () => {
  return (
    <footer>
      <a href="#" className='footer__logo'>Agung YZS</a>
    
    <ul className='permalinks'>
      <li><a href="#">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#experience">Experience</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>

    <div className="footer__socials">
      <a href="https://instagram.com/agungyzs"><BsInstagram/></a>
      <a href="https://twitter.com/coolerayz"><FaTwitterSquare/></a>
    </div>

    <div className="footer__copyright">
      <small>&copy; AgungYZS. All rights reserved.</small>
    </div>
    </footer>
  )
}

export default Footer