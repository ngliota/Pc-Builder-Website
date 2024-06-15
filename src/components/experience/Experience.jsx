import React from 'react';
import './experience.css';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { BsCpuFill } from "react-icons/bs";
import { BsGpuCard } from "react-icons/bs";
import { BsFillMotherboardFill } from "react-icons/bs";
import { BsMotherboard } from "react-icons/bs";
import { RiRam2Fill } from "react-icons/ri";
import { BsDeviceSsdFill } from "react-icons/bs";
import { BsDeviceHddFill } from "react-icons/bs";

const Experience = () => {
  return (
    <section id='experience'>
      <h5>PC Building</h5>
      <h2>Simulation</h2>

      <div className="container experience__container">
        <div className="experience__frontend">
          <div className="experience__content">
            <details className='experience__details'>
              <summary>
                <BsFillPatchCheckFill className='experience__details-icon' />
                <h4>CPU</h4>
              </summary>
              <small className='text-light'>Intermediate</small>
            </details>
            <details className='experience__details'>
              <summary>
                <BsFillPatchCheckFill className='experience__details-icon' />
                <h4>Motherboard</h4>
              </summary>
              <small className='text-light'>apacoba</small>
            </details>
            <details className='experience__details'>
              <summary>
                <BsFillPatchCheckFill className='experience__details-icon' />
                <h4>GPU</h4>
              </summary>
              <small className='text-light'>Intermediate</small>
            </details>
            <details className='experience__details'>
              <summary>
                <BsFillPatchCheckFill className='experience__details-icon' />
                <h4>Python</h4>
              </summary>
              <small className='text-light'>Basic</small>
            </details>
            <details className='experience__details'>
              <summary>
                <BsFillPatchCheckFill className='experience__details-icon' />
                <h4>React</h4>
              </summary>
              <small className='text-light'>Basic</small>
            </details>
            <details className='experience__details'>
              <summary>
                <BsFillPatchCheckFill className='experience__details-icon' />
                <h4>JavaScript</h4>
              </summary>
              <small className='text-light'>Basic</small>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Experience;
