const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// --- EXECUTION QUEUE CONFIG ---
const QUEUE_CONFIG = {
    c: { maxParallel: 5, maxQueue: 40, timeLimit: 2000, memoryLimit: 64 * 1024 * 1024, cooldown: 5000 },
    java: { maxParallel: 1, maxQueue: 20, timeLimit: 2000, memoryLimit: 128 * 1024 * 1024, cooldown: 5000 }
};

const executionQueues = { c: [], java: [] };
const activeExecutions = { c: 0, java: 0 };
const lastRequestTime = {}; // { lotNumber: timestamp }

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
    const { lotNumber, lotName, collegeName } = req.body;
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
                college_name: collegeName,
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
    const { lotNumber, code, codeMap, totalTime, warnings, linesOfCode, noOfLoops, attempts, patternsCompleted } = req.body;
    try {
        // Store codeMap as JSON string if available, else just code
        const codeToStore = codeMap ? JSON.stringify(codeMap) : code;

        await db.query(`
            UPDATE users 
            SET total_time = ?, warnings = ?, lines_of_code = ?, no_of_loops = ?, attempts = ?, code_data = ?, patterns_completed = ?, last_active = NOW()
            WHERE lot_number = ? AND status != 'finished'
        `, [totalTime, warnings, linesOfCode, noOfLoops || 0, attempts, codeToStore, patternsCompleted || 0, lotNumber]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// 4. Finish Level (Success)
app.post('/api/finish', async (req, res) => {
    const { lotNumber, totalTime, linesOfCode, noOfLoops, attempts, codeMap, patternsCompleted } = req.body;
    try {
        const codeToStore = codeMap ? JSON.stringify(codeMap) : null;
        let query = `
            UPDATE users 
            SET status = 'finished', end_time = ?, total_time = ?, lines_of_code = ?, no_of_loops = ?, attempts = ?, patterns_completed = ?
            WHERE lot_number = ?
        `;
        let params = [Date.now(), totalTime, linesOfCode, noOfLoops || 0, attempts, patternsCompleted || 0, lotNumber];

        if (codeToStore) {
            query = `
                UPDATE users 
                SET status = 'finished', end_time = ?, total_time = ?, lines_of_code = ?, no_of_loops = ?, attempts = ?, patterns_completed = ?, warnings = ?, code_data = ?
                WHERE lot_number = ?
            `;
            params = [Date.now(), totalTime, linesOfCode, noOfLoops || 0, attempts, patternsCompleted || 0, req.body.warnings || 0, codeToStore, lotNumber];
        } else {
            query = `
                UPDATE users 
                SET status = 'finished', end_time = ?, total_time = ?, lines_of_code = ?, no_of_loops = ?, attempts = ?, patterns_completed = ?, warnings = ?
                WHERE lot_number = ?
            `;
            params = [Date.now(), totalTime, linesOfCode, noOfLoops || 0, attempts, patternsCompleted || 0, req.body.warnings || 0, lotNumber];
        }

        await db.query(query, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 4.5. Disqualify User (Time Up)
app.post('/api/disqualify', async (req, res) => {
    const { lotNumber } = req.body;
    try {
        await db.query("UPDATE users SET status = 'disqualified' WHERE lot_number = ?", [lotNumber]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Leaderboard (Admin) - Updated sorting logic
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM users 
            ORDER BY 
                patterns_completed DESC,
                (status = 'finished') DESC,
                total_time ASC,
                no_of_loops ASC,
                lines_of_code ASC,
                warnings ASC,
                attempts ASC
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

// 10. EXECUTION ENDPOINT (Queue System)
app.post('/api/execute', async (req, res) => {
    const { language, code, lotNumber } = req.body;
    const langKey = language === 'c' ? 'c' : 'java';
    const config = QUEUE_CONFIG[langKey];
    const now = Date.now();

    try {
        // 1. SESSION CHECK (DB)
        const [rows] = await db.query('SELECT status FROM users WHERE lot_number = ?', [lotNumber]);

        if (rows.length === 0) {
            console.log(`[EXECUTE DENIED] User ${lotNumber} not found.`);
            return res.status(404).json({ message: "User not found" });
        }

        if (rows[0].status !== 'active') {
            console.log(`[EXECUTE DENIED] User ${lotNumber} status is '${rows[0].status}'`);
            return res.status(403).json({ message: `Session ${rows[0].status}` });
        }

        // 2. COOLDOWN CHECK
        const lastTime = lastRequestTime[lotNumber] || 0;
        if (now - lastTime < config.cooldown) {
            const waitTime = Math.ceil((config.cooldown - (now - lastTime)) / 1000);
            return res.status(429).json({ message: `Cooldown active. Wait ${waitTime}s.` });
        }

        // 3. QUEUE SIZE CHECK
        if (executionQueues[langKey].length >= config.maxQueue) {
            return res.status(503).json({ message: "Server busy. Queue full." });
        }

        // 4. ADD TO QUEUE
        lastRequestTime[lotNumber] = now; // Set cooldown immediately

        // Piston Runtime Config
        const runtime = langKey === 'c'
            ? { language: 'c', version: '10.2.0' }
            : { language: 'java', version: '15.0.2' };

        // Create Promise to handle response later
        const executionPromise = new Promise((resolve, reject) => {
            executionQueues[langKey].push({
                code,
                runtime,
                resolve,
                reject
            });
        });

        // Trigger Processing
        processQueue(langKey);

        // Wait for result
        const result = await executionPromise;
        res.json(result);

    } catch (err) {
        console.error("Execution Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Helper: Process Queue
async function processQueue(lang) {
    if (activeExecutions[lang] >= QUEUE_CONFIG[lang].maxParallel) return;
    if (executionQueues[lang].length === 0) return;

    // Take next job
    const job = executionQueues[lang].shift();
    activeExecutions[lang]++;

    try {
        // Call Piston
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: job.runtime.language,
                version: job.runtime.version,
                files: [{ content: job.code }],
                run_timeout: QUEUE_CONFIG[lang].timeLimit, // Piston expects milliseconds
            })
        });
        const data = await response.json();
        job.resolve(data);
    } catch (err) {
        job.reject(err);
    } finally {
        activeExecutions[lang]--;
        // Process next
        processQueue(lang);
    }
}

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});

module.exports = app;
