import React from 'react'
import {BsLinkedin} from 'react-icons/bs'
import {FaGithub} from 'react-icons/fa'
import {SiDiscord} from 'react-icons/si'

const HeaderSocials = () => {
  return (
    <div className='header__socials'>
        <a href="https://linkedin.com/in/AgungSiregar" target="_blank"><BsLinkedin/></a>
        <a href="https://github.com/ngliota" target="_blank"><FaGithub/></a>
        <a href="https://discordapp.com/users/189648229141315585" target="_blank"><SiDiscord/></a>
    </div>
  )
}

export default HeaderSocials