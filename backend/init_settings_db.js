const pool = require('./db');

async function initSettingsDB() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to TiDB!');

        // 1. Create System Config Table
        const configTable = `
            CREATE TABLE IF NOT EXISTS system_config (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value VARCHAR(50),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await connection.query(configTable);
        console.log('Table system_config created.');

        // 2. Insert Default Settings (Only if not exists)
        const defaults = [
            { key: 'PASTE_SECURITY', value: 'true' },
            { key: 'FOCUS_SECURITY', value: 'true' },
            { key: 'SESSION_DURATION_MINUTES', value: '60' }
        ];

        for (const setting of defaults) {
            const [rows] = await connection.query('SELECT * FROM system_config WHERE setting_key = ?', [setting.key]);
            if (rows.length === 0) {
                await connection.query('INSERT INTO system_config (setting_key, setting_value) VALUES (?, ?)',
                    [setting.key, setting.value]);
                console.log(`Inserted default for ${setting.key}`);
            }
        }

        connection.release();
        console.log('Settings Table Initialization Complete! ⚙️');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing Settings DB:', err);
        process.exit(1);
    }
}

initSettingsDB();
