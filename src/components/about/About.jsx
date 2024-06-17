import React from 'react';
import './about.css';
import { FaComputer } from "react-icons/fa6";
import { FaUniversity } from 'react-icons/fa';
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { Slide } from 'react-slideshow-image';
import "react-slideshow-image/dist/styles.css";
import review1 from "../../assets/pc1.jpg"
import review2 from "../../assets/pc2.jpg"
import review3 from "../../assets/pc3.jpg"

const slideImages = [review1, review2, review3];

const About = () => {
  return (
    <section id="about"> {/* Change id to "about" */}
      <h5>Get To Know</h5>
      <h2>About Us</h2>
      <div className="container about__container">
        <div className="about__me">
          <div className="about__me-image">
            <Slide
              easing="ease"
              autoScroll={true}
              autoScroll-interval={3000}
            >
              {slideImages.map((slideImage, index) => (
                <div className="each-slide" key={index}>
                  <img src={slideImage} alt={`Slide ${index}`} />
                </div>
              ))}
            </Slide>
          </div>
        </div>
        <div className="about__content">
          <div className="about__cards">
            <article className='about__card'>
              <FaComputer className='about__icon'/>
              <h5>Experience</h5>
              <small>2 Years learning<br/>computer hardware</small>
            </article>

            <article className='about__card'>
              <FaUniversity className='about__icon'/>
              <h5>Academic</h5>
              <small>CCIT FTUI University of Indonesia <br/>and AeU Malaysia</small>
            </article>
            
            <article className='about__card'>
              <HiWrenchScrewdriver className='about__icon'/>
              <h5>Projects</h5>
              <small>Over 5 Star ratings<br/>PC builded</small>
            </article>
          </div>
          <p>
            We are students from CCIT FTUI University of Indonesia and AeU Malaysia majoring in Bachelor of Information and Communication Technology (B.ICT) and (DNIIT), 
            brilliant in academics and computer enthusiasts. We have engaged in various aspects of computing and technology, 
            including PC Building, Embedded systems, IoT frameworks, computer systems, databases, networking, and cybersecurity. We have opportunities to explore emerging technologies, 
            participate in practical projects, and gain hands-on experience in solving real-world problems using technology.
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;
