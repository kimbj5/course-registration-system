// server.js - Express app: serves the web pages and (in later tasks) the API.
require('dotenv').config();

const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Serve the web pages. Only the public/ folder is exposed, so server.js, .env,
// the SQL scripts, and package.json can never be downloaded from the site.
app.use(express.static(path.join(__dirname, 'public')));

// Setup check: is the server running, and can it reach the database?
// It never sends error details back, because they could reveal server settings.
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Database check failed:', err.code || err.message);
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// The endpoints from API_CONTRACT.md are added here in later tasks.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.post('/students/login', async (req, res) => {
  const { student_id, password } = req.body;

  // Check required fields
  if (
    student_id === undefined ||
    student_id === null ||
    String(student_id).trim() === '' ||
    password === undefined ||
    password === null ||
    String(password).trim() === ''
  ) {
    return res.status(400).json({
      error: {
        code: 'MISSING_FIELDS',
        message: 'Please enter your Student ID and password.'
      }
    });
  }

  // Student IDs must be positive integers
  if (!/^[1-9]\d*$/.test(String(student_id))) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Please enter a valid Student ID.'
      }
    });
  }

  try {
    // Find the student in the database
    const [students] = await db.query(
      `SELECT student_id, first_name, last_name, password_hash
       FROM Student
       WHERE student_id = ?`,
      [Number(student_id)]
    );

    if (students.length === 0) {
      return res.status(401).json({
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student ID not found.'
        }
      });
    }

    const student = students[0];

    // Compare the submitted password with the stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      student.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: {
          code: 'INCORRECT_PASSWORD',
          message: 'Incorrect password.'
        }
      });
    }

    // Create a signed login token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured.');
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Login is temporarily unavailable.'
        }
      });
    }

    const token = jwt.sign(
      { student_id: student.student_id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Never return the password or password hash
    return res.status(200).json({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      token
    });
  } catch (err) {
    console.error('Student login failed:', err.code || err.message);

    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Unable to log in right now. Please try again.'
      }
    });
  }
});




const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log('Course registration system running on port ' + PORT);

  // Report the database status at startup, but keep the pages up either way.
  db.query('SELECT 1')
    .then(() => console.log('Database connection OK'))
    .catch((err) => console.error('Database connection FAILED:', err.code || err.message));
});
