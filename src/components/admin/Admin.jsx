import React, { useEffect, useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext'; // Adjust the path based on your project structure

const Admin = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext); // Get isLoggedIn and setIsLoggedIn from AuthContext
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await axios.get('https://backend.agungyzs.site/check-auth', {
          withCredentials: true, // Ensure cookies are included in the request
        });
        if (response.data.loggedIn) {
          setIsLoggedIn(true);
          fetchNotes(); // Fetch notes upon successful login
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    };
    checkLogin();
  }, [navigate, setIsLoggedIn]);

  const handleLogout = async () => {
    try {
      await axios.post('https://backend.agungyzs.site/logout', {}, {
        withCredentials: true, // Ensure cookies are included in the request
      });
      setIsLoggedIn(false);
      navigate('/login');
    } catch (error) {
      alert('Error logging out');
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await axios.get('https://backend.agungyzs.site/notes', {
        withCredentials: true, // Ensure cookies are included in the request
      });
      if (response.data && response.data.notes) {
        setNotes(response.data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  return isLoggedIn ? (
    <div>
      <h2>Admin Page</h2>
      <button onClick={handleLogout}>Logout</button>
      <h3>Notes:</h3>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <strong>User:</strong> {note.username}<br />
            <strong>Note:</strong> {note.note_content}
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <div>Loading...</div>
  );
};

export default Admin;
