import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header/Header';
import Nav from './components/nav/Nav';
import About from './components/about/About';
import Experience from './components/experience/Experience';
import Footer from './components/footer/Footer';
import Contact from './components/contact/Contact';
import Simulation from './components/simulation/Simulation';
import CTA from './components/header/CTA';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header />
                <Nav />
                <CTA />
                <About />
                <Experience />
                <Contact />
                <Footer />
              </>
            }
          />
          <Route path="/simulation" element={<Simulation />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;