const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDb() {
    db = await open({
        filename: path.join(__dirname, 'rtc.sqlite'),
        driver: sqlite3.Database
    });

    // Create Users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create Rooms table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT,
            host_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(host_id) REFERENCES users(id)
        );
    `);

    console.log('SQLite database initialized.');
    return db;
}

function getDb() {
    return db;
}

module.exports = { initDb, getDb };
