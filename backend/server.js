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

// 2. Participant Login (Start/Resume Session)
app.post('/api/login', async (req, res) => {
    const { lotNumber, lotName, collegeName } = req.body;
    try {
        // Check if user exists
        const [rows] = await db.query('SELECT * FROM users WHERE lot_number = ?', [lotNumber]);

        if (rows.length > 0) {
            // User exists, just return info (Resume)
            // If they are finished or disqualified, the frontend handles that based on `status`.
            return res.json({ success: true, user: rows[0], isNew: false });
        } else {
            // New User, Create
            const newUser = {
                lot_number: lotNumber,
                lot_name: lotName,
                college_name: collegeName,
                start_time: null, // Timer has not started yet
                total_time: 0,
                patterns_completed: 0,
                status: 'active'
            };
            await db.query('INSERT INTO users SET ?', newUser);
            return res.json({ success: true, user: newUser, isNew: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
});

// 2.1 Start Timer and Lock Language
app.post('/api/start', async (req, res) => {
    const { lotNumber, language } = req.body;
    try {
        // Double check they exist and haven't started
        const [rows] = await db.query('SELECT * FROM users WHERE lot_number = ?', [lotNumber]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const user = rows[0];

        // Only set start_time if it's currently null
        if (!user.start_time) {
            const startTimeNum = Date.now(); // Integer format to match DB column
            const initialCodeData = JSON.stringify({ language: language, map: {} });

            await db.query('UPDATE users SET start_time = ?, code_data = ? WHERE lot_number = ?', [startTimeNum, initialCodeData, lotNumber]);

            res.json({ success: true, start_time: startTimeNum, code_data: initialCodeData });
        } else {
            // They already started, just return success with existing data
            res.json({ success: true, start_time: user.start_time, code_data: user.code_data });
        }
    } catch (err) {
        console.error("Error at api/start:", err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
});

// 2.5 Fetch Current Session State
app.get('/api/me/:lotNumber', async (req, res) => {
    const { lotNumber } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE lot_number = ?', [lotNumber]);
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error("Error fetching user session:", err);
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
                (warnings = 0) DESC,                -- 1. No warnings first, warning users last
                patterns_completed DESC,           -- 2. Most patterns first
                (no_of_loops = 0) ASC,             -- 3. Treat 0 loops as worst in its group
                no_of_loops ASC,                   -- 4. Fewer loops is better
                total_time ASC,                    -- 5. Faster time is better
                lines_of_code ASC,                 -- 6. Fewer lines of code is better
                attempts ASC                       -- 7. Fewer attempts as final tie-breaker
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
        await db.query(`
            INSERT INTO system_config (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [key, String(value)]);
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

        // JDoodle Runtime Config
        const runtime = langKey === 'c'
            ? { language: 'c', versionIndex: '5' }
            : { language: 'java', versionIndex: '4' };

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
// --- JDOODLE HARDCODED KEYS (Bypassing Render Env Issues) ---
const JDOODLE_KEYS = [
    { id: "e9d4c44d39706bc115fd78d1fa94ae0b", secret: "2301490931d4fb5120c3a90054f4fdaf62adbab50e1c5340fb66a95834784950" },
    { id: "b30629e21f310dbf19aba52408e2a2a8", secret: "d6d0b3c5e9375561a3cb95bae07c99f682d80010bd2a8d11f431f49ff06c78e2" },
    { id: "fd83f9d57ac69f9adeff2a6fdc73ffdb", secret: "6defdfd8ddeaae552104964104bf893d24f18eab5dd80d680cee93bf8cf519fa" },
    { id: "314ca30886bd9620faafe84a5a0c4ebb", secret: "c5c89a82ce82dc00d0983371b8b6313d4435b8aaac6b20dc03892ef6e63c4487" },
    { id: "9b7149e8f712ebe613986a00957e3edb", secret: "5ace899a89ab28e7060c5e7cac49205df46387367e9d58d96bc379e7ce08fdce" },
    { id: "4b8d713065b8a0e847e698912c745460", secret: "5ffb6c31effdf8914baabda5ec20bb461e1b7b75ecbcf2e825a0b3f5c7ff26b9" },
    { id: "decd504ec47ed1355d951fe5779d0fe4", secret: "db582301b8d5e24094bd8e2f51293ece3198a377d3b8cb933d799416acb2a401" },
    { id: "196cb515a1006555e7ace58f43fc4c17", secret: "5befa1e4d25d261b6deff0b916fcc82d4a15fd3c7bd1fc0046e4990feb86b85b" },
    { id: "b5d77dc299692b52116de24ffbbf19ac", secret: "3f1840cca41b59d9b0e694cd26c969f9c38b3de9d49e895299ce08af6234270d" },
    { id: "ef832f26f387fdabc20f1ab5600fd398", secret:"6cd152d68ddd2d04c3ef229f60fb6afb6291ad137ea0246ee7734b7bbf948ab2"  },
    { id: "f979e6144c4a43700876fcad294de5c0", secret: "1e9a334be85af822673e25547a5b94e362b00fbccd355cb57a740517042e3138" },
    { id: "ac5e6f41a7cad46d5b37a318ebd0ed78", secret: "2e2384b0c3237b2fe0f3c177bc0b9d17bfed2b3356e385851cf25cc4efec6e6e" },
    { id: "508f04c91c99911af75cdc21fb72c675", secret: "7c090ad0c46b72b47138ecff18c9a3f168faa77e129f75aadc915d61d668ecb2" },
    { id: "fa0cf8185c0b2b43c26e87ab5649c691", secret: "779e4df53c34ad549665ed6fc17a4509ac357377c9462ffd3d370bea94aed840" },
    { id: "3717e4a63f833cce76eb5a610b0a58ff", secret: "532ff37974a65ad86e39bb42f71d2df4ef2ab68301f2f78e54c7a5217cb76f75" },
    { id: "dbf60ee909b6ef93e7f3845376c7a9ea", secret: "49862081bbe1c2e1494173b5ee79a09def675f4e481fb0755541a623c798d3f5" },
    { id: "721971bed2443f06b09cf9d965e40e2c", secret: "c15b9aec9b3540942a72f012d05160099348b8fecbfe987a59f1b22a9e3d2ad4" },
    { id: "cfbbe31583110e83c74f5ae7ea77b6bf", secret: "5c0e0bbc30ac9e5ad8f675c9b6c31abe562f2c8e11bddce2fec8b512c59393c4" },
    { id: "9baba800dcad9f64d0ef7e180226bcd0", secret: "e4916385a6e5c003d267d919fa41de009c579684f69bf141e742d15069d2a5bb" },
    { id: "a9b709e280afbc916252ce9a691641f9", secret: "806d741cd61967262c1641da1d2fe7f8e77489f56dbcb6506a1d57b0561407d3" },
    { id: "3513793f9cb42dce8d7bc7b79ce9ac72", secret: "2da50081c7ffbf9841b3547fa7dd2cf6ac3405d6b3474ec360938260a549f70c" },
    { id: "9f2dd28002c61669a6ad40bed46b19b3", secret: "fd365b49e35fa273a1c678af84d58e19bd3f8aab98f700d2136d5c42005e4b9f" }
];
let currentJdoodleKeyIndex = 0;

// Helper: Process Queue
async function processQueue(lang) {
    if (activeExecutions[lang] >= QUEUE_CONFIG[lang].maxParallel) return;
    if (executionQueues[lang].length === 0) return;
    // Take next job
    const job = executionQueues[lang].shift();
    activeExecutions[lang]++;

    let retryCount = 0;
    let executionSuccess = false;
    let lastError = "Unknown API Error";

    while (retryCount < JDOODLE_KEYS.length && !executionSuccess) {
        try {
            const clientId = JDOODLE_KEYS[currentJdoodleKeyIndex].id;
            const clientSecret = JDOODLE_KEYS[currentJdoodleKeyIndex].secret;

            console.log(`[JDoodle Execution] Attempt ${retryCount + 1}: Using Hardcoded Key Index ${currentJdoodleKeyIndex + 1}`);

            // Call JDoodle
            const response = await fetch('https://api.jdoodle.com/v1/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    clientSecret,
                    script: job.code,
                    language: job.runtime.language,
                    versionIndex: job.runtime.versionIndex
                })
            });
            const data = await response.json();

            // Check for JDoodle errors (API limits, authentication)
            if (data.error) {
                console.log(`[JDoodle Execution] Key ${currentJdoodleKeyIndex + 1} Failed: ${data.error} - Auto-Rotating to next key...`);
                lastError = data.error;
                currentJdoodleKeyIndex = (currentJdoodleKeyIndex + 1) % JDOODLE_KEYS.length;
                retryCount++;
            } else {
                // Map JDoodle response ({output, statusCode, memory, cpuTime}) to Piston format expected by frontend
                job.resolve({
                    run: {
                        stdout: data.statusCode === 200 ? data.output : '',
                        stderr: data.statusCode !== 200 ? data.output : '',
                        code: data.statusCode === 200 ? 0 : 1
                    }
                });
                executionSuccess = true;
                // Move to next key for the NEXT new user request to load balance
                currentJdoodleKeyIndex = (currentJdoodleKeyIndex + 1) % JDOODLE_KEYS.length;
            }

        } catch (error) {
            console.error(`[JDoodle Execution] Call Error:`, error);
            lastError = "Internal Execution Error";
            currentJdoodleKeyIndex = (currentJdoodleKeyIndex + 1) % JDOODLE_KEYS.length;
            retryCount++;
        }
    }

    if (!executionSuccess) {
        console.error(`[JDoodle Execution] ALL 6 KEYS EXHAUSTED OR FAILED.`);
        job.resolve({ run: { stderr: `JDoodle Error: ${lastError}` }, message: lastError });
    }

    // Always run finally logic
    activeExecutions[lang]--;
    // Process next in queue
    processQueue(lang);
}

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});

module.exports = app;
