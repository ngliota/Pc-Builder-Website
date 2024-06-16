import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header/Header';
import Nav from './components/nav/Nav';
import About from './components/about/About';
import Experience from './components/experience/Experience';
import Footer from './components/footer/Footer';
import Contact from './components/contact/Contact';
import Simulation from './components/simulation/Simulation';
import Login from './components/login/Login'; // Import Login component
import Admin from './components/admin/Admin'; // Import Admin component

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
                <About />
                <Experience />
                <Contact />
                <Footer />
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
