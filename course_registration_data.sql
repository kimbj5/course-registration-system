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

-- Test logins (student_id / password). Only the bcrypt hash is stored.
-- 1 / TestPass123    2 / TestPass456    3 / Pass1003    4 / Pass1004
-- 5 / Pass1005       6 / Pass1006       7 / Pass1007    8 / Pass1008
-- 9 / Pass1009       10 / Pass1010
INSERT INTO Student
    (student_id, student_number, first_name, last_name, password_hash)
VALUES
(1,  '1001001', 'Nathan',   'Reinoehl', '$2b$10$CdeA6iDHG1ZExbM1OOnNxOUmTPNkPcE2p8bixUaDs72CowNvYIaDC'),
(2,  '1001002', 'John',     'Miller',   '$2b$10$kGGq4ChZ.7FkrVWUEXZHt.fllzTExFPrNPh.oXOBOhSkKjMPOBhf2'),
(3,  '1001003', 'Emily',    'Carter',   '$2b$10$4ZNzUmpsHSjqIXr4u7ZHZuQWXRUcgszKlqNWd6MDn1f/NyqiG1URW'),
(4,  '1001004', 'Jessica',  'Lee',      '$2b$10$Ly99OwdzkMVtTcdA.c3TuOdWG/sFt./MJpK/5Pg57EEsCcLO.NTO2'),
(5,  '1001005', 'Daniel',   'White',    '$2b$10$7ECDnzd.4oz.ruas3ZiLOO2t5VsHJMPCTN8/lT3XPBt/jGnvnvGOe'),
(6,  '1001006', 'Sophia',   'Martin',   '$2b$10$mOC1nbTczqWXQK0Jk0fhU.16JDqIkRBDfwIXbMR9H4dP63VTTS4r2'),
(7,  '1001007', 'Olivia',   'Green',    '$2b$10$Y4gwVrtYvnLz2Q6IdvFbkuj5ytBvQW3XOYyBNvLUwWUWkTEi7RxXq'),
(8,  '1001008', 'Jacob',    'Harris',   '$2b$10$ywHk89LxEIVM0QK4YImUyO7nMNxyvbYsawuoQx6AMscuYqu4/F5V6'),
(9,  '1001009', 'Ethan',    'Young',    '$2b$10$hbrJzxF9iqm4chTP6L/giuIjdcxlQMHIkDpkzwI.ZvR5qj0jm7sHq'),
(10, '1001010', 'Ava',      'Scott',    '$2b$10$Y/B/EGT3WLeYM903LjF47e.byFmCeyzfEk490xUhn.QXpxCjfHZXq');

INSERT INTO Session
(course_id, instructor_id, section, days, time, location, max_enrollment)
VALUES
(1, 1, '001', 'MW', '09:00 AM - 10:15 AM', 'Online', 25),
(2, 2, '001', 'TR', '10:30 AM - 11:45 AM', 'Building A Room 101', 30),
(3, 3, '001', 'MW', '01:00 PM - 02:15 PM', 'Hybrid', 20),
(4, 6, '001', 'TR', '12:30 PM - 01:45 PM', 'Building B Room 108', 30),
(5, 4, '001', 'F', '09:00 AM - 11:50 AM', 'Building B Room 205', 3),
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
(10, 4, 'Enrolled'),
-- Session 5 (MKTG 302) is full: 3 of 3 seats, for testing SESSION_FULL.
(7, 5, 'Enrolled'),
(8, 5, 'Enrolled');
