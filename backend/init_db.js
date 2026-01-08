const pool = require('./db');

async function initDB() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to TiDB!');

        // 1. Database already selected via .env config
        console.log('Using database from config...');

        // 2. Create Users Table
        const userTable = `
            CREATE TABLE IF NOT EXISTS users (
                lot_number VARCHAR(50) PRIMARY KEY,
                lot_name VARCHAR(100),
                status ENUM('active', 'finished', 'disqualified') DEFAULT 'active',
                start_time BIGINT,
                end_time BIGINT,
                total_time BIGINT DEFAULT 0,
                warnings INT DEFAULT 0,
                lines_of_code INT DEFAULT 0,
                attempts INT DEFAULT 0,
                language VARCHAR(20),
                language VARCHAR(20),
                code_data TEXT,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await connection.query(userTable);

        // Add code_data column if it doesn't exist (for migration)
        try {
            await connection.query("ALTER TABLE users MODIFY COLUMN code_data LONGTEXT");
            await connection.query("ALTER TABLE users ADD COLUMN patterns_completed INT DEFAULT 0");
            console.log("Upgraded Schema: code_data LONGTEXT, added patterns_completed.");
        } catch (e) {
            // Ignore if exists
        }

        console.log('Table users created.');

        // 3. Create Patterns Table
        const patternTable = `
            CREATE TABLE IF NOT EXISTS patterns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                target_output TEXT,
                level_order INT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(patternTable);
        console.log('Table patterns created.');

        // 4. Insert Default Pattern (Triangle)
        const defaultPattern = `* * * * *
*     *
*   *
* *
*`;
        // Check if exists
        const [rows] = await connection.query('SELECT * FROM patterns WHERE level_order = 1');
        if (rows.length === 0) {
            await connection.query('INSERT INTO patterns (name, target_output, level_order) VALUES (?, ?, ?)',
                ['Hollow Triangle', defaultPattern, 1]);
            console.log('Default pattern inserted.');
        }

        connection.release();
        console.log('Database Initialization Complete! 🚀');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing DB:', err);
        process.exit(1);
    }
}

initDB();
