import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid'; // Import UUID v4 function

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

const db = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root", // Replace with your MySQL username
    password: "", // Replace with your MySQL password
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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours session lifetime
    }
}));

// Helper function to check user credentials
const checkCredentials = async (username, password, table) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ${table} WHERE username = ?`;
        db.query(query, [username], async (err, result) => {
            if (err) {
                return reject(err);
            }

            if (result.length === 0) {
                return resolve(null);
            }

            const user = result[0];
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return resolve(null);
            }

            resolve(user);
        });
    });
};

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Signup route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Check if the username already exists in the users table
        const checkQuery = `SELECT * FROM users WHERE username = ?`;
        db.query(checkQuery, [username], async (err, result) => {
            if (err) {
                throw err;
            }

            if (result.length > 0) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            // If username is unique, hash the password and insert into users table
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4(); // Generate UUID for user id using uuidv4()
            const insertQuery = `INSERT INTO users (userid, username, password) VALUES (?, ?, ?)`;
            db.query(insertQuery, [userId, username, hashedPassword], (err, result) => {
                if (err) {
                    throw err;
                }
                res.status(200).json({ message: 'Signup successful' });
            });
        });
    } catch (error) {
        console.error('Error signing up:', error);
        return res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

// Login route for both admins and users
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user exists in admins table
        let user = await checkCredentials(username, password, 'admins');

        if (!user) {
            // If not found in admins table, check users table
            user = await checkCredentials(username, password, 'users');
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Determine role based on which table the user was found in
        const role = user.hasOwnProperty('admin_id') ? 'admin' : 'user';
        req.session.user = user; // Store user information in session
        req.session.role = role; // Store user role in session
        res.status(200).json({ role });
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

// Check if user is logged in
app.get('/check-auth', (req, res) => {
    if (req.session && req.session.user) {
        res.status(200).json({ message: 'Logged in', user: req.session.user, role: req.session.role });
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
