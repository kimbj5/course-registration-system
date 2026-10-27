INSERT INTO Course (department, number, name, credits)
VALUES
('Information Systems', 'INFO 465', 'Cloud Computing', 3),
('Information Systems', 'INFO 370', 'Database Systems', 3),
('Information Systems', 'INFO 325', 'Systems Analysis', 3),
('Information Systems', 'INFO 300', 'Information Technology Infrastructure', 3),
('Marketing', 'MKTG 302', 'Marketing Research', 3),
('Marketing', 'MKTG 410', 'Digital Marketing', 3);

INSERT INTO Instructor (first_name, last_name)
VALUES
('Sarah', 'Johnson'),
('Michael', 'Brown'),
('David', 'Wilson'),
('Emily', 'Davis'),
('Jennifer', 'Smith'),
('Michael', 'McGarry');

INSERT INTO Student (first_name, last_name)
VALUES
('Nathan', 'Reinoehl'),
('John', 'Miller'),
('Emily', 'Carter'),
('Jessica', 'Lee'),
('Daniel', 'White'),
('Sophia', 'Martin'),
('Olivia', 'Green'),
('Jacob', 'Harris'),
('Ethan', 'Young'),
('Ava', 'Scott');

INSERT INTO Session
(course_id, instructor_id, section, days, time, location, max_enrollment)
VALUES
(1, 1, '001', 'MW', '09:00 AM - 10:15 AM', 'Online', 25),
(2, 2, '001', 'TR', '10:30 AM - 11:45 AM', 'Building A Room 101', 30),
(3, 3, '001', 'MW', '01:00 PM - 02:15 PM', 'Hybrid', 20),
(4, 4, '001', 'TR', '02:30 PM - 03:45 PM', 'Online', 35),
(5, 5, '001', 'F', '09:00 AM - 11:50 AM', 'Building B Room 205', 40),
(6, 6, '001', 'MW', '12:30 PM - 01:45 PM', 'Building B Room 108', 30);

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
