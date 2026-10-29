USE course_registration;

INSERT INTO Course (department, number, name, credits)
VALUES
('Information Systems', 'INFO 465', 'Cloud Computing', 3),
('Information Systems', 'INFO 370', 'Database Systems', 3),
('Information Systems', 'INFO 325', 'Systems Analysis', 3),
('Information Systems', 'INFO 300', 'Information Technology Infrastructure', 3),
('Marketing', 'MKTG 302', 'Marketing Research', 3),
('Marketing', 'MKTG 410', 'Digital Marketing', 3);

INSERT INTO Instructor (first_name, last_name, password_hash)
VALUES
('Sarah', 'Johnson', SHA2('TestPass123', 256)),
('Michael', 'Brown', SHA2('TestPass123', 256)),
('David', 'Wilson', SHA2('TestPass123', 256)),
('Emily', 'Davis', SHA2('TestPass123', 256)),
('Jennifer', 'Smith', SHA2('TestPass123', 256)),
('Michael', 'McGarry', SHA2('TestPass123', 256));

INSERT INTO Student
    (student_number, first_name, last_name, password_hash)
VALUES
('1001001', 'Nathan',   'Reinoehl', '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001002', 'John',     'Miller',   '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001003', 'Emily',    'Carter',   '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001004', 'Jessica',  'Lee',      '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001005', 'Daniel',   'White',    '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001006', 'Sophia',   'Martin',   '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001007', 'Olivia',   'Green',    '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001008', 'Jacob',    'Harris',   '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001009', 'Ethan',    'Young',    '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe'),
('1001010', 'Ava',      'Scott',    '$2b$10$/DTjH0EDJreubCBrE9Y0COzpeVx/AUYvrUR.M/R82XgIBqFTKzjbe');

INSERT INTO Session
(course_id, instructor_id, section, days, time, location, max_enrollment)
VALUES
(1, 1, '001', 'MW', '09:00 AM - 10:15 AM', 'Online', 25),
(2, 2, '001', 'TR', '10:30 AM - 11:45 AM', 'Building A Room 101', 30),
(3, 3, '001', 'MW', '01:00 PM - 02:15 PM', 'Hybrid', 20),
(4, 6, '001', 'MW', '12:30 PM - 01:45 PM', 'Building B Room 108', 30),
(5, 4, '001', 'F', '09:00 AM - 11:50 AM', 'Building B Room 205', 40),
(6, 5, '001', 'MW', '12:30 PM - 01:45 PM', 'Building B Room 108', 30);

INSERT INTO Prerequisite (course_id, prerequisite_course_id)
VALUES
(2, 3),
(1, 2);

INSERT INTO Enrollment (student_id, session_id, status)
VALUES
(1, 1, 'Enrolled'),
(1, 2, 'Enrolled'),
(2, 1, 'Enrolled'),
(3, 2, 'Enrolled'),
(4, 3, 'Enrolled'),
(5, 4, 'Enrolled'),
(6, 5, 'Enrolled'),
(7, 1, 'Enrolled'),
(8, 2, 'Enrolled'),
(9, 3, 'Enrolled'),
(10, 4, 'Enrolled');
