// routes/courses.js - GET /courses: search the course catalog.
// Matches the endpoint described in API_CONTRACT.md. All three filters are
// optional and combine with AND. Everything is read from the database.
const express = require('express');
const db = require('../db');

const router = express.Router();

// Turn text typed by a user into a LIKE pattern that means "contains this text".
// "!" is the escape character, so a typed % or _ is treated as ordinary text.
function likePattern(text) {
  return '%' + text.replace(/[!%_]/g, '!$&') + '%';
}

// Read one optional query value as trimmed text. Anything that is not
// plain text (for example a repeated parameter) is ignored.
function readText(value) {
  return typeof value === 'string' ? value.trim().slice(0, 100) : '';
}

router.get('/', async (req, res) => {
  const department = readText(req.query.department);
  const instructor = readText(req.query.instructor);
  const number = readText(req.query.number);

  try {
    // Build the WHERE part from only the filters that were filled in.
    // Values are always passed as parameters (the ? marks), never pasted into the SQL.
    const conditions = [];
    const params = [];

    if (department) {
      conditions.push('c.department = ?');
      params.push(department);
    }

    if (number) {
      conditions.push("c.number LIKE ? ESCAPE '!'");
      params.push(likePattern(number));
    }

    if (instructor) {
      // A course matches when the instructor of ANY of its sessions matches.
      conditions.push(`c.course_id IN (
        SELECT s.course_id
        FROM Session s
        JOIN Instructor i ON i.instructor_id = s.instructor_id
        WHERE i.first_name LIKE ? ESCAPE '!'
           OR i.last_name LIKE ? ESCAPE '!'
           OR CONCAT(i.first_name, ' ', i.last_name) LIKE ? ESCAPE '!'
      )`);
      const pattern = likePattern(instructor);
      params.push(pattern, pattern, pattern);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [courseRows] = await db.query(
      `SELECT c.course_id, c.department, c.number, c.name, c.credits
       FROM Course c
       ${where}
       ORDER BY c.number`,
      params
    );

    const courseIds = courseRows.map((course) => course.course_id);
    let sessionRows = [];
    let prerequisiteRows = [];

    if (courseIds.length > 0) {
      // enrolled_count is not stored anywhere: it is the number of Enrollment
      // rows for the session with status 'Enrolled'.
      [sessionRows] = await db.query(
        `SELECT s.session_id, s.course_id, s.section, s.days, s.time, s.location,
                s.max_enrollment, i.instructor_id, i.first_name, i.last_name,
                (SELECT COUNT(*) FROM Enrollment e
                  WHERE e.session_id = s.session_id AND e.status = 'Enrolled') AS enrolled_count
         FROM Session s
         JOIN Instructor i ON i.instructor_id = s.instructor_id
         WHERE s.course_id IN (?)
         ORDER BY s.course_id, s.section`,
        [courseIds]
      );

      [prerequisiteRows] = await db.query(
        `SELECT p.course_id, pc.course_id AS required_course_id, pc.number, pc.name
         FROM Prerequisite p
         JOIN Course pc ON pc.course_id = p.prerequisite_course_id
         WHERE p.course_id IN (?)
         ORDER BY pc.number`,
        [courseIds]
      );
    }

    const courses = courseRows.map((course) => ({
      course_id: course.course_id,
      department: course.department,
      number: course.number,
      name: course.name,
      credits: course.credits,
      prerequisites: prerequisiteRows
        .filter((row) => row.course_id === course.course_id)
        .map((row) => ({
          course_id: row.required_course_id,
          number: row.number,
          name: row.name
        })),
      sessions: sessionRows
        .filter((row) => row.course_id === course.course_id)
        .map((row) => ({
          session_id: row.session_id,
          section: row.section,
          days: row.days,
          time: row.time,
          location: row.location,
          max_enrollment: row.max_enrollment,
          enrolled_count: Number(row.enrolled_count),
          instructor: {
            instructor_id: row.instructor_id,
            first_name: row.first_name,
            last_name: row.last_name
          }
        }))
    }));

    res.json({ count: courses.length, courses });
  } catch (err) {
    // Log only the error code. Details could reveal database settings.
    console.error('GET /courses failed:', err.code || err.message);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Could not search courses. Please try again.' }
    });
  }
});
// GET /courses/:id - Get details for one course
router.get('/:id', async (req, res) => {
  const courseId = Number(req.params.id);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    return res.status(400).json({
      error: { code: 'INVALID_ID', message: 'Invalid course ID.' }
    });
  }

  try {
    const [courses] = await db.query(
      `SELECT course_id, department, number, name, credits
       FROM Course
       WHERE course_id = ?`,
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Course not found.' }
      });
    }

    const [sessions] = await db.query(
      `SELECT s.session_id, s.section, s.days, s.time, s.location,
              s.max_enrollment, i.instructor_id, i.first_name, i.last_name,
              (SELECT COUNT(*)
               FROM Enrollment e
               WHERE e.session_id = s.session_id
                 AND e.status = 'Enrolled') AS enrolled_count
       FROM Session s
       JOIN Instructor i ON i.instructor_id = s.instructor_id
       WHERE s.course_id = ?
       ORDER BY s.section`,
      [courseId]
    );

    const [prerequisites] = await db.query(
      `SELECT pc.course_id, pc.number, pc.name
       FROM Prerequisite p
       JOIN Course pc ON pc.course_id = p.prerequisite_course_id
       WHERE p.course_id = ?
       ORDER BY pc.number`,
      [courseId]
    );

    res.json({
      ...courses[0],
      prerequisites,
      sessions: sessions.map((session) => ({
        ...session,
        enrolled_count: Number(session.enrolled_count),
        seats_left: Math.max(
          0,
          Number(session.max_enrollment) - Number(session.enrolled_count)
        ),
        instructor: {
          instructor_id: session.instructor_id,
          first_name: session.first_name,
          last_name: session.last_name
        }
      }))
    });
  } catch (err) {
    console.error('GET /courses/:id failed:', err.code || err.message);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Could not load course details. Please try again.'
      }
    });
  }
});

module.exports = router;
