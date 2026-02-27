require('dotenv').config();

async function testAllKeys() {
    console.log("Testing all 6 JDoodle Keys from .env...");

    for (let i = 1; i <= 6; i++) {
        const clientId = process.env[`JDOODLE_CLIENT_ID_${i}`];
        const clientSecret = process.env[`JDOODLE_CLIENT_SECRET_${i}`];

        if (!clientId || !clientSecret) {
            console.log(`Key ${i} is missing in .env!`);
            continue;
        }

        const response = await fetch('https://api.jdoodle.com/v1/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                script: "print('hello')",
                language: "python3",
                versionIndex: "4"
            })
        });

        const data = await response.json();

        if (data.error) {
            console.log(`❌ Key ${i} FAILED:`, data.error);
        } else {
            console.log(`✅ Key ${i} SUCCESS! statusCode:`, data.statusCode);
        }
    }
}

testAllKeys();
