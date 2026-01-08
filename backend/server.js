const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// --- ROUTES ---

// 1. Admin Login
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
        return res.json({ success: true, token: 'admin-secret-token-123' });
    }
    return res.status(401).json({ success: false, message: 'Invalid Credentials' });
});

// 2. Participant Login (Start Session)
app.post('/api/login', async (req, res) => {
    const { lotNumber, lotName } = req.body;
    try {
        // Check if user exists
        const [rows] = await db.query('SELECT * FROM users WHERE lot_number = ?', [lotNumber]);

        if (rows.length > 0) {
            // User exists, just return info
            return res.json({ success: true, user: rows[0] });
        } else {
            // New User, Create
            const newUser = {
                lot_number: lotNumber,
                lot_name: lotName,
                start_time: Date.now(),
                status: 'active'
            };
            await db.query('INSERT INTO users SET ?', newUser);
            return res.json({ success: true, user: newUser });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
});

// 3. Update Progress (Auto-save / Run Code)
app.post('/api/update-progress', async (req, res) => {
    const { lotNumber, code, codeMap, totalTime, warnings, linesOfCode, attempts, patternsCompleted } = req.body;
    try {
        // Store codeMap as JSON string if available, else just code
        const codeToStore = codeMap ? JSON.stringify(codeMap) : code;

        await db.query(`
            UPDATE users 
            SET total_time = ?, warnings = ?, lines_of_code = ?, attempts = ?, code_data = ?, patterns_completed = ?, last_active = NOW()
            WHERE lot_number = ?
        `, [totalTime, warnings, linesOfCode, attempts, codeToStore, patternsCompleted || 0, lotNumber]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// 4. Finish Level (Success)
app.post('/api/finish', async (req, res) => {
    const { lotNumber, totalTime, linesOfCode, attempts, codeMap, patternsCompleted } = req.body;
    try {
        const codeToStore = codeMap ? JSON.stringify(codeMap) : null;
        let query = `
            UPDATE users 
            SET status = 'finished', end_time = ?, total_time = ?, lines_of_code = ?, attempts = ?, patterns_completed = ?
            WHERE lot_number = ?
        `;
        let params = [Date.now(), totalTime, linesOfCode, attempts, patternsCompleted || 0, lotNumber];

        if (codeToStore) {
            query = `
                UPDATE users 
                SET status = 'finished', end_time = ?, total_time = ?, lines_of_code = ?, attempts = ?, code_data = ?
                WHERE lot_number = ?
            `;
            params = [Date.now(), totalTime, linesOfCode, attempts, codeToStore, lotNumber];
        }

        await db.query(query, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 5. Leaderboard (Admin) - Kept same, but we can reuse for Participants list too if we want
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM users 
            ORDER BY 
                patterns_completed DESC,
                total_time ASC,
                lines_of_code ASC,
                attempts ASC,
                last_active ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Participants Management (Admin)
app.get('/api/admin/participants', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users ORDER BY last_active DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/participants/:lotNumber', async (req, res) => {
    const { lotNumber } = req.params;
    try {
        await db.query('DELETE FROM users WHERE lot_number = ?', [lotNumber]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Get System Settings (Existing)
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_config');
        const settings = {};
        rows.forEach(row => {
            // Return raw string value to support Numbers/Mixed types
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Update System Settings (Existing)
app.post('/api/settings', async (req, res) => {
    const { key, value } = req.body;
    try {
        await db.query('UPDATE system_config SET setting_value = ? WHERE setting_key = ?', [String(value), key]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Pattern Management (Existing)
app.get('/api/admin/patterns', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM patterns ORDER BY level_order ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/patterns', async (req, res) => {
    const { name, targetOutput, levelOrder } = req.body;
    try {
        await db.query('INSERT INTO patterns (name, target_output, level_order) VALUES (?, ?, ?)',
            [name, targetOutput, levelOrder]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/patterns/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM patterns WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
    });
}

module.exports = app;
