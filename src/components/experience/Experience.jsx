import React from 'react';
import './experience.css';
import roadmap from "../../assets/roadmap.png"


const Experience = () => {
  return (
    <section id='experience'>
      <h5>PC Building</h5>
      <h2>Roadmap</h2>

      <div className="container experience__container">
          <img src={roadmap} alt="me" />
          </div>    
    </section>
  );
}

export default Experience;
