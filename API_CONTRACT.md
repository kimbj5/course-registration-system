# Course Registration System: API Contract

Oct 27, 2026 · Ryan

## What an API contract is, and the rules every endpoint follows

An API contract is the written agreement between the web pages and the server: for each endpoint it fixes the URL, the inputs, the outputs, and the errors. The page builders and the API builders can then work at the same time and test against the same document. Here the pages are HTML and JavaScript, the API is Node.js with Express on EC2, and the database is MySQL on RDS (from the README).

Field names below are the column names in `course_registration_schema.sql`. A value the API works out instead of storing is marked **computed**.

- **Format:** requests and responses are JSON (`Content-Type: application/json`). Ids such as `student_id` are numbers, matching the `INT` columns.
- **Paths:** exactly as written in the backlog, with no prefix.
- **Auth:** the two login endpoints return a `token`. Every other endpoint needs `Authorization: Bearer <token>`.
- **Ownership:** a student may only use `/students/{id}/...` with their own `student_id`, and an instructor only their own `instructor_id`. Anything else returns `403`.
- **Rules live in the API, not the page:** the API never lets a session go over `max_enrollment` and never creates a duplicate registration. The seat check and the new `Enrollment` row happen in one database transaction, so two students cannot take the last seat at once.
- **Errors** always use this shape, and `message` is the text the page shows:

```json
{ "error": { "code": "SESSION_FULL", "message": "INFO 465, Section 001 is full." } }
```

| Status | Meaning |
| --- | --- |
| 200 | Read succeeded |
| 201 | A registration was created |
| 400 | Missing or invalid input |
| 401 | Not logged in, or login failed |
| 403 | Logged in but not allowed (another student's data, a roster you may not see) |
| 404 | The student, instructor, course, or session does not exist |
| 409 | A rule blocked it: session full, already registered, prerequisite not met |

## Database tables and API fields

The schema has six tables. Every field the API sends or accepts uses these column names unchanged.

**Student**

| Column | Type | Notes |
| --- | --- | --- |
| `student_id` | INT | Primary key, auto-generated |
| `first_name` | VARCHAR(50) |  |
| `last_name` | VARCHAR(50) |  |
| `password_hash` | VARCHAR(255) | Hashed password, checked at login and never returned by the API |

**Instructor**

| Column | Type | Notes |
| --- | --- | --- |
| `instructor_id` | INT | Primary key, auto-generated |
| `first_name` | VARCHAR(50) |  |
| `last_name` | VARCHAR(50) |  |
| `password_hash` | VARCHAR(255) | Hashed password, checked at login and never returned by the API |

**Course**

| Column | Type | Notes |
| --- | --- | --- |
| `course_id` | INT | Primary key, auto-generated |
| `department` | VARCHAR(100) | For example `Information Systems` |
| `number` | VARCHAR(20) | The full course code, for example `INFO 465` |
| `name` | VARCHAR(100) |  |
| `credits` | INT |  |

**Session** (one section of a course)

| Column | Type | Notes |
| --- | --- | --- |
| `session_id` | INT | Primary key, auto-generated |
| `course_id` | INT | Refers to `Course.course_id` |
| `instructor_id` | INT | Refers to `Instructor.instructor_id` |
| `section` | VARCHAR(20) | For example `001` |
| `days` | VARCHAR(50) | For example `MW` |
| `time` | VARCHAR(50) | One text value, for example `09:00 AM - 10:15 AM` |
| `location` | VARCHAR(100) | For example `Building A Room 101` |
| `max_enrollment` | INT | Required |

**Enrollment** (a student registered in a session)

| Column | Type | Notes |
| --- | --- | --- |
| `enrollment_id` | INT | Primary key, auto-generated |
| `student_id` | INT | Refers to `Student.student_id` |
| `session_id` | INT | Refers to `Session.session_id` |
| `status` | VARCHAR(30) | `Enrolled` in the data script. The roster page also shows `Waitlisted`. |

**Prerequisite** (a course that must be completed first)

| Column | Type | Notes |
| --- | --- | --- |
| `course_id` | INT | The course that has the requirement. Part of the primary key. |
| `prerequisite_course_id` | INT | The course that must be done first. Part of the primary key. |

**Values the API computes** (no column stores them)

| Field | How it is worked out |
| --- | --- |
| `enrolled_count` | Number of `Enrollment` rows for the session whose `status` is `Enrolled`. Open seats = `max_enrollment` minus `enrolled_count`. |
| `prerequisites` | The `Prerequisite` rows for a course, each returned as `{ "course_id", "number", "name" }` of the required course. |
| `instructor` | The session's `Instructor` row, returned as `{ "instructor_id", "first_name", "last_name" }`. |
| `course` | The session's `Course` row, returned as `{ "course_id", "department", "number", "name", "credits" }`. |

**Names the API adds around the data** (not columns, and not worked out from them)

| Name | Where it appears | Meaning |
| --- | --- | --- |
| `password` | Login requests only | The password the user typed. It is compared with `password_hash`. |
| `token` | Login responses | Proof of login, sent back in the `Authorization` header. Not stored in these tables. |
| `count` | `GET /courses` | How many courses matched. |
| `courses`, `sessions`, `students`, `enrollments` | List responses | The list of matching `Course`, `Session`, `Student`, or `Enrollment` rows. In a roster, each item in `students` is the `Student` columns plus the `Enrollment.status`. |
| `enrollment`, `session` | `POST /sessions/{id}/register` 201 response | The new `Enrollment` row, and the session's `session_id`, `max_enrollment`, and updated `enrolled_count`. |
| `error` with `code` and `message` | Every error response | See the error rules at the top. |
| `missing` | `PREREQUISITE_MISSING` error | The course numbers the student still needs. |

## Student endpoints

Five endpoints cover login, search, open sessions, registering, and the student's schedule. All except login need the student's token. The examples use the rows in `course_registration_data.sql`.

### POST /students/login

Logs a student in. A student counts as logged in only when both the ID and the password check pass, so typing credentials into the form is never enough to register.

**Request body**

```json
{ "student_id": 1, "password": "<password>" }
```

**200 response**

```json
{ "student_id": 1, "first_name": "Nathan", "last_name": "Reinoehl", "token": "<opaque string>" }
```

| Status | `error.code` | `error.message` |
| --- | --- | --- |
| 400 | `MISSING_FIELDS` | Please enter your Student ID and password. |
| 401 | `STUDENT_NOT_FOUND` | Student ID not found. |
| 401 | `INCORRECT_PASSWORD` | Incorrect password. |

The typed password is compared with `Student.password_hash`, which the API never returns.

### GET /courses

Searches the course catalog. Every query parameter is optional, and they combine with AND. With none, it returns every course. Each course carries its sessions, because the instructor and the maximum enrollment are stored on `Session`.

| Query parameter | Matches |
| --- | --- |
| `department` | Exact match on `Course.department` |
| `number` | Case-insensitive contains on `Course.number`, for example `370` or `info` |
| `instructor` | Case-insensitive contains on the `first_name` or `last_name` of the instructor of any of the course's sessions |

**200 response.** No matches is still `200` with an empty list. Example: `GET /courses?number=370`

```json
{
  "count": 1,
  "courses": [
    {
      "course_id": 2,
      "department": "Information Systems",
      "number": "INFO 370",
      "name": "Database Systems",
      "credits": 3,
      "prerequisites": [
        { "course_id": 3, "number": "INFO 325", "name": "Systems Analysis" }
      ],
      "sessions": [
        {
          "session_id": 2,
          "section": "001",
          "days": "TR",
          "time": "10:30 AM - 11:45 AM",
          "location": "Building A Room 101",
          "max_enrollment": 30,
          "enrolled_count": 3,
          "instructor": { "instructor_id": 2, "first_name": "Michael", "last_name": "Brown" }
        }
      ]
    }
  ]
}
```

A course with no sessions returns `"sessions": []`.

### GET /sessions/available

Lists the sessions open for registration, each with its course and instructor so the page can show a full card. A full session is still listed so the page can show it with a disabled button.

| Query parameter | Matches |
| --- | --- |
| `course_id` | Exact match on `Session.course_id`. Used when a student arrives from the course details page. |

**200 response**

```json
{
  "sessions": [
    {
      "session_id": 3,
      "course_id": 3,
      "instructor_id": 3,
      "section": "001",
      "days": "MW",
      "time": "01:00 PM - 02:15 PM",
      "location": "Hybrid",
      "max_enrollment": 20,
      "enrolled_count": 2,
      "course": { "course_id": 3, "department": "Information Systems", "number": "INFO 325", "name": "Systems Analysis", "credits": 3 },
      "instructor": { "instructor_id": 3, "first_name": "David", "last_name": "Wilson" }
    }
  ]
}
```

### POST /sessions/{id}/register

Registers the logged-in student for the session in the path. `{id}` is the `session_id`. The student comes from the token, so the body is empty. The API checks login, session, duplicate, prerequisites, and seats **before** it creates the `Enrollment` row.

**201 response.** Example: `POST /sessions/3/register` as student 1

```json
{
  "message": "Successfully registered for INFO 325, Section 001.",
  "enrollment": { "enrollment_id": 12, "student_id": 1, "session_id": 3, "status": "Enrolled" },
  "session": { "session_id": 3, "max_enrollment": 20, "enrolled_count": 3 }
}
```

| Status | `error.code` | `error.message` |
| --- | --- | --- |
| 401 | `NOT_LOGGED_IN` | Please log in with valid credentials before registering. |
| 404 | `SESSION_NOT_FOUND` | Session not found. |
| 409 | `ALREADY_REGISTERED` | You are already registered for INFO 325. |
| 409 | `SESSION_FULL` | INFO 325, Section 001 is full. |
| 409 | `PREREQUISITE_MISSING` | Prerequisite not met: INFO 325. The error also carries `"missing": ["INFO 325"]`. |

`ALREADY_REGISTERED` means the student already has an `Enrollment` for any session of the same course. A refused registration changes nothing: no `Enrollment` row is created and `enrolled_count` stays as it was.

### GET /students/{id}/enrollments

Returns the sessions the student is registered in, and only that student's own records. `{id}` is the `student_id`.

**200 response**

```json
{
  "student_id": 1,
  "enrollments": [
    {
      "enrollment_id": 1,
      "status": "Enrolled",
      "session": {
        "session_id": 1,
        "section": "001",
        "days": "MW",
        "time": "09:00 AM - 10:15 AM",
        "location": "Online",
        "max_enrollment": 25,
        "enrolled_count": 3,
        "course": { "course_id": 1, "department": "Information Systems", "number": "INFO 465", "name": "Cloud Computing", "credits": 3 },
        "instructor": { "instructor_id": 1, "first_name": "Sarah", "last_name": "Johnson" }
      }
    }
  ]
}
```

A student with no registrations gets `200` with `"enrollments": []`. Another student's `{id}` returns `403 FORBIDDEN`.

## Instructor endpoints

Three endpoints cover instructor login, the teaching schedule, and the session roster. The roster is restricted: only the session's assigned instructor and administrators can read it.

### POST /instructors/login

Logs an instructor in. It works like the student login but uses `instructor_id`.

**Request body**

```json
{ "instructor_id": 1, "password": "<password>" }
```

**200 response**

```json
{ "instructor_id": 1, "first_name": "Sarah", "last_name": "Johnson", "token": "<opaque string>" }
```

| Status | `error.code` | `error.message` |
| --- | --- | --- |
| 400 | `MISSING_FIELDS` | Please enter your Instructor ID and password. |
| 401 | `INSTRUCTOR_NOT_FOUND` | Instructor ID not found. |
| 401 | `INCORRECT_PASSWORD` | Incorrect password. |

Like the student login, the typed password is compared with `Instructor.password_hash`, which the API never returns.

### GET /instructors/{id}/schedule

Returns every session assigned to the logged-in instructor, meaning the `Session` rows whose `instructor_id` matches, and only theirs. `{id}` is the `instructor_id`. The fields match the columns of the Assigned Sessions table: Course, Section, Days, Time, Location.

**200 response**

```json
{
  "instructor_id": 1,
  "sessions": [
    {
      "session_id": 1,
      "section": "001",
      "days": "MW",
      "time": "09:00 AM - 10:15 AM",
      "location": "Online",
      "max_enrollment": 25,
      "enrolled_count": 3,
      "course": { "course_id": 1, "department": "Information Systems", "number": "INFO 465", "name": "Cloud Computing", "credits": 3 }
    }
  ]
}
```

| Status | `error.code` | When |
| --- | --- | --- |
| 401 | `NOT_LOGGED_IN` | No valid instructor token |
| 403 | `FORBIDDEN` | `{id}` is a different instructor |
| 404 | `INSTRUCTOR_NOT_FOUND` | No instructor with that `instructor_id` |

### GET /sessions/{id}/roster

Returns the students in one session. `{id}` is the `session_id`. The columns match the roster table (Student ID, Name, Status), plus the enrolled count against the maximum. `students` lists every `Enrollment` row for the session, while `enrolled_count` counts only those with `status` `Enrolled`.

**200 response**

```json
{
  "session_id": 1,
  "section": "001",
  "course": { "course_id": 1, "number": "INFO 465", "name": "Cloud Computing" },
  "enrolled_count": 3,
  "max_enrollment": 25,
  "students": [
    { "student_id": 1, "first_name": "Nathan", "last_name": "Reinoehl", "status": "Enrolled" },
    { "student_id": 2, "first_name": "John", "last_name": "Miller", "status": "Enrolled" },
    { "student_id": 7, "first_name": "Olivia", "last_name": "Green", "status": "Enrolled" }
  ]
}
```

| Status | `error.code` | When |
| --- | --- | --- |
| 401 | `NOT_LOGGED_IN` | No valid instructor or administrator token |
| 403 | `FORBIDDEN` | The caller is a student, an instructor not assigned to this session, or anyone else |
| 404 | `SESSION_NOT_FOUND` | No session with that `session_id` |

## Proposed endpoints (not named in the backlog)

Three endpoints are needed by user stories that name no endpoint. They are proposals for the team to accept or change.

| Endpoint | Needed by | What it does |
| --- | --- | --- |
| `GET /courses/{id}` | Story 4, View Course Details | `{id}` is the `course_id`. Returns one course in the same shape as an item of `GET /courses`, with its `prerequisites` and `sessions`. `404 COURSE_NOT_FOUND` if it does not exist. The details page's `?course=` link parameter then carries a `course_id`, not a course code. |
| `POST /sessions` | Story 8, Administrator Manages Sessions | Creates a session. Body: `course_id`, `instructor_id`, `section`, `days`, `time`, `location`, `max_enrollment`. Returns `201` with the new session, including its `session_id`. Administrator token only. `404 COURSE_NOT_FOUND` or `404 INSTRUCTOR_NOT_FOUND` if either id is unknown. |
| `PUT /sessions/{id}` | Story 8, Administrator Manages Sessions | `{id}` is the `session_id`. Updates any of the same fields. Returns `200` with the updated session. Administrator token only. Lowering `max_enrollment` below the current `enrolled_count` returns `409 BELOW_CURRENT_ENROLLMENT`. |

Stories 5, 10, and 11 need no student-facing endpoint. The nightly catalog update, the daily enrollment report, and the confirmation email are background jobs. The catalog is read-only inside this system, so there is no `POST` or `PUT` for `/courses`.

## Gaps between the schema and what the app needs

The password columns and the data script are now fixed in the SQL files. What is left are decisions the team should make before building.

- [ ] **No administrator.** The roster and session-management endpoints allow administrators, but no table or column says who is one. Add an `Administrator` table or a `role` column.
- [ ] **No way to know a course was completed.** `PREREQUISITE_MISSING` needs the student's finished courses. Decide whether `Enrollment.status` gets a `Completed` value or a separate record is kept.
- [ ] **Duplicate registrations are not blocked by the database.** `Enrollment` has no unique rule on `student_id` and `session_id`. Add one as a safety net, and keep the API check that blocks the same course in another section.
- [ ] **Modality has no column.** The search and details pages show In-Person, Hybrid, or Online, but the schema has no field for it. The data script puts `Online` and `Hybrid` in `Session.location`. Add a `modality` column to `Session`, or drop it from the pages.
- [ ] **The pages still use test data.** `course-data.js` and `auth.js` hold courses such as `INFO 320` and `CS 301` and student IDs such as `1001001`. The database has `INFO 465`, `INFO 370`, and student IDs 1 to 10. When the API goes live the pages call it instead, and the test cases in `tests/` need the new IDs.
- [ ] **Waitlist.** The roster page shows `Waitlisted`, but registration refuses a full session, so nothing creates a waitlisted `Enrollment`. Either remove the status from the page or add a waitlist rule.
