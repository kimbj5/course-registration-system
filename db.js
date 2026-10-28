// db.js - the one place the app connects to MySQL.
// The connection settings come from environment variables, which are loaded
// from the .env file. No secret is written in this file, so it is safe to commit.
require('dotenv').config();

const mysql = require('mysql2/promise');

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((name) => process.env[name] === undefined);

if (missing.length > 0) {
  throw new Error(
    'Missing database settings: ' + missing.join(', ') +
    '. Copy .env.example to .env and fill them in.'
  );
}

// A pool keeps a few connections open and shares them between requests.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
