const db = require('./db');
require('dotenv').config();

const runMigration = async () => {
    try {
        console.log("Checking if no_of_loops column exists...");
        // This is a naive check; ideally we check information_schema, but direct ALTER IGNORE or catch error is easier for a quick script
        try {
            await db.query(`ALTER TABLE users ADD COLUMN no_of_loops INT DEFAULT 0`);
            console.log("SUCCESS: Added 'no_of_loops' column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'no_of_loops' already exists.");
            } else {
                throw err;
            }
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed:", err.message);
        process.exit(1);
    }
};

runMigration();
