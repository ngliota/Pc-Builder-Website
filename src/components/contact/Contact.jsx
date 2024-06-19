import React, { useState } from 'react';
import './contact.css';
import { MdOutlineEmail } from 'react-icons/md';
import { FaGithub } from 'react-icons/fa';
import { BsLinkedin } from 'react-icons/bs';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  async function Submit(e) {
    e.preventDefault();
    setLoading(true);

    const formEle = document.querySelector("form");
    const formData = new FormData(formEle);
    formData.append("sheetName", "Feedback"); // Ensure it sends to the correct sheet

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyPhMr-Sko1JL8N0OC9xNNSFzSTqqP4ZEqogTwxdtPcKYCwUQmwIakOerlCM9_st_U8/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setFormSubmitted(true);
        formEle.reset();
        setTimeout(() => {
          setFormSubmitted(false);
        }, 1000);
      } else {
        console.error("Failed to submit form");
      }
    } catch (error) {
      console.error("Error during form submission", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id='contact'>
      <h5>Get In Touch</h5>
      <h2>Contact Us</h2>

      <div className="container contact__container">
        <div className="contact__options">
          <article className="contact__option">
            <MdOutlineEmail className='contact__option-icon' />
            <h4>Email</h4>
            <h5>agungyzs02@gmail.com</h5>
            <a href="mailto:agungyzs02@gmail.com">Send a message</a>
          </article>
          <article className="contact__option">
            <BsLinkedin className='contact__option-icon' />
            <h4>LinkedIn</h4>
            <h5>Agung Siregar</h5>
            <a href="https://linkedin.com/in/agungsiregar/" target="_blank" rel="noopener noreferrer">Open my LinkedIn</a>
          </article>
          <article className="contact__option">
            <FaGithub className='contact__option-icon' />
            <h4>Github</h4>
            <h5>ngliota</h5>
            <a href="https://github.com/ngliota" target="_blank" rel="noopener noreferrer">Open my Github</a>
          </article>
        </div>
        {/* END OF CONTACT OPTIONS */}

        <form className="form" onSubmit={Submit}>
          <label htmlFor="Name">Name</label>
          <input type="text" id="Name" name="Name" placeholder="Your Name" required />

          <label htmlFor="Email">Email</label>
          <input type="email" id="Email" name="Email" placeholder="Your Email" required />

          <label htmlFor="Message">Message</label>
          <textarea id="Message" name="Message" rows="7" placeholder="Your Message" required></textarea>

          <button type='submit' className='btn btn-primary' disabled={loading || formSubmitted}>
            {loading ? "Loading..." : formSubmitted ? "Message Sent" : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
