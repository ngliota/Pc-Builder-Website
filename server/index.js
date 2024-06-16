import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
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
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Admin login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = 'SELECT * FROM admins WHERE username = ?';
    db.query(query, [username], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (result.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = result[0];
        const isValidPassword = await bcrypt.compare(password, admin.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.adminId = admin.id;
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
