require('dotenv').config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "doctor"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("📋 Check your .env file and MySQL server");
    process.exit(1); // Exit if database connection fails
  }
  console.log(`✅ MySQL Connected to database: ${process.env.DB_NAME}`);
});

// Handle connection errors
db.on('error', (err) => {
  console.error('❌ Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

module.exports = db;
