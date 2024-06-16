import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: 'root',
    password: "",
    database: 'pcbuildweb'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Admin login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for user: ${username}`);

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = 'SELECT * FROM admins WHERE username = ?';
    db.query(query, [username], async (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'An error occurred while querying the database' });
        }

        if (result.length === 0) {
            console.log('Invalid credentials: user not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = result[0];
        console.log('Admin found:', admin);

        const isValidPassword = await bcrypt.compare(password, admin.password);
        console.log('Password valid:', isValidPassword);

        if (!isValidPassword) {
            console.log('Invalid credentials: incorrect password');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.adminId = admin.id;
        console.log('Login successful');
        res.status(200).json({ message: 'Login successful' });
    });
});

// Check if admin is logged in
app.get('/admin', (req, res) => {
    if (req.session.adminId) {
        res.status(200).json({ message: 'Logged in' });
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logged out' });
    });
});

app.listen(8081, () => {
    console.log("Connected to the server");
});

//singup

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    console.log(`Signup attempt for user: ${username}`);
  
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    const query = 'SELECT * FROM admins WHERE username = ?';
    db.query(query, [username], async (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'An error occurred while querying the database' });
      }
  
      if (result.length > 0) {
        console.log('Username already exists');
        return res.status(409).json({ message: 'Username already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = 'INSERT INTO admins (username, password) VALUES (?, ?)';
      db.query(insertQuery, [username, hashedPassword], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'An error occurred while inserting the user' });
        }
  
        console.log('User registered successfully');
        res.status(201).json({ message: 'Signup successful' });
      });
    });
  });
  
