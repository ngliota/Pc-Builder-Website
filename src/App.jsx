import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/header/Header';
import Nav from './components/nav/Nav';
import About from './components/about/About';
import Experience from './components/experience/Experience';
import Footer from './components/footer/Footer';
import Contact from './components/contact/Contact';
import Simulation from './components/simulation/Simulation';
import Login from './components/login/Login';
import Signup from './components/signup/Signup';
import History from './components/history/History';
import { AuthProvider } from './contexts/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Nav />
        <div className="content">
          <Routes>
            <Route
              path="/home"
              element={
                <>
                  <Header />
                  <About />
                  <Experience />
                  <Contact />
                </>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/simulation" element={<Simulation />} />
            
            {/* Redirect all other routes to '/home' */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
