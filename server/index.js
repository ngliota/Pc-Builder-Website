import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Connection Pooling
const db = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: 'pcbuildweb'
});

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours session lifetime
    }
}));

// Authentication Middleware
const authenticateSession = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
};

// Promisified MySQL Query Function
const queryAsync = (pool, query, values) => {
    return new Promise((resolve, reject) => {
        pool.query(query, values, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

// Helper function to check user credentials
const checkCredentials = async (username, password, table) => {
    try {
        const query = `SELECT * FROM ${table} WHERE username = ?`;
        const result = await queryAsync(db, query, [username]);
        
        if (result.length === 0) {
            return null;
        }
        
        const user = result[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return null;
        }
        
        return user;
    } catch (error) {
        throw error;
    }
};

// Signup route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const checkQuery = `SELECT * FROM users WHERE username = ?`;
        const result = await queryAsync(db, checkQuery, [username]);
        
        if (result.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const insertQuery = `INSERT INTO users (userid, username, password) VALUES (?, ?, ?)`;
        await queryAsync(db, insertQuery, [userId, username, hashedPassword]);

        res.status(200).json({ message: 'Signup successful' });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await checkCredentials(username, password, 'users');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = user;
        req.session.role = 'user'; // Adjust as needed
        
        res.status(200).json({ role: 'user', user: { userid: user.userid } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Simulation save route
app.post('/api/save-simulation', authenticateSession, async (req, res) => {
    const { simulationid, userid, name, phoneNumber, cpu, motherboard, ram, gpu, ssd, hdd, pcCase, monitor } = req.body;

    try {
        const query = 'INSERT INTO history (simulationid, userid, name, phoneNumber, cpu, motherboard, ram, gpu, ssd, hdd, pcCase, monitor, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        const values = [simulationid, userid, name, phoneNumber, cpu, motherboard, ram, gpu, ssd, hdd, pcCase, monitor];

        await queryAsync(db, query, values);

        res.status(200).json({ message: 'Simulation data saved successfully' });
    } catch (error) {
        console.error('Error saving simulation data:', error);
        res.status(500).json({ message: 'Failed to save simulation data' });
    }
});

// Delete a history entry by simulationid
app.delete('/api/history/:simulationid', authenticateSession, async (req, res) => {
    const { simulationid } = req.params;
    
    try {
        const query = 'DELETE FROM history WHERE simulationid = ?';
        const result = await queryAsync(db, query, [simulationid]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Simulation not found' });
        }
        
        res.status(200).json({ message: 'Simulation deleted successfully' });
    } catch (error) {
        console.error('Error deleting simulation:', error);
        res.status(500).json({ message: 'Failed to delete simulation' });
    }
});

// Fetch simulation data by simulationid
app.get('/api/get-simulation/:simulationid', authenticateSession, async (req, res) => {
    const simulationid = req.params.simulationid;

    try {
        const query = 'SELECT * FROM history WHERE simulationid = ?';
        const result = await queryAsync(db, query, [simulationid]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Simulation data not found' });
        }

        res.status(200).json(result[0]); // Assuming simulationid is unique, return the first result
    } catch (error) {
        console.error('Error fetching simulation data:', error);
        res.status(500).json({ message: 'Failed to fetch simulation data' });
    }
});

// Update simulation entry route
app.put('/api/update-simulation/:simulationid', authenticateSession, async (req, res) => {
    const simulationid = req.params.simulationid;
    const { name, phoneNumber, cpu, motherboard, ram, gpu, ssd, hdd, pcCase, monitor } = req.body;

    try {
        const query = `
            UPDATE history 
            SET name=?, phoneNumber=?, cpu=?, motherboard=?, ram=?, gpu=?, ssd=?, hdd=?, pcCase=?, monitor=? 
            WHERE simulationid=?`;

        const values = [name, phoneNumber, cpu, motherboard, ram, gpu, ssd, hdd, pcCase, monitor, simulationid];

        await queryAsync(db, query, values);

        res.status(200).json({ message: 'Simulation updated successfully' });
    } catch (error) {
        console.error('Error updating simulation:', error);
        res.status(500).json({ message: 'Failed to update simulation' });
    }
});

// Fetch all simulations for the logged-in user
app.get('/api/history', authenticateSession, async (req, res) => {
    const userId = req.session.user.userid;
    console.log('Fetching history for userId:', userId); // Logging userId
    const query = 'SELECT * FROM history WHERE userid = ? ORDER BY created_at DESC';
    try {
        const results = await queryAsync(db, query, [userId]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'No history found' });
        }
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
});

// Update history entry route
app.put('/api/history/:id', authenticateSession, async (req, res) => {
    const historyId = req.params.id;
    const { simulationid, name, phoneNumber, cpu, motherboard, ram, gpu, ssd, hdd, pcCase, monitor } = req.body;

    try {
        const query = `
            UPDATE history 
            SET simulationid=?, name=?, phoneNumber=?, cpu=?, motherboard=?, ram=?, gpu=?, ssd=?, hdd=?, pcCase=?, monitor=? 
            WHERE id=?`;

        const values = [simulationid, name, phoneNumber, cpu, motherboard, ram, gpu, ssd, hdd, pcCase, monitor, historyId];

        await queryAsync(db, query, values);

        res.status(200).json({ message: 'History entry updated successfully' });
    } catch (error) {
        console.error('Error updating history entry:', error);
        res.status(500).json({ message: 'Failed to update history entry' });
    }
});

// Check authentication route
app.get('/check-auth', (req, res) => {
    if (req.session && req.session.user) {
        res.status(200).json({ message: 'Logged in', user: req.session.user, role: req.session.role });
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
