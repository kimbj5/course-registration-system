async function attemptLogin(studentID, password) {
    if (studentID === "" || password.trim() === "") {
        return {
            ok: false,
            error: "Please enter your Student ID and password."
        };
    }

    try {
        const response = await fetch("/students/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                student_id: studentID,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                error: data.error?.message || "Login failed. Please try again."
            };
        }

        // Remember the logged-in student and their token.
        sessionStorage.setItem("loggedInStudent", String(data.student_id));
        sessionStorage.setItem("loggedInStudentData", JSON.stringify({
            student_id: data.student_id,
            first_name: data.first_name,
            last_name: data.last_name
        }));
        sessionStorage.setItem("authToken", data.token);

        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            error: "Unable to connect to the server. Please try again."
        };
    }
}

function getLoggedInStudent() {
    return sessionStorage.getItem("loggedInStudent");
}

function getLoggedInStudentData() {
    const data = sessionStorage.getItem("loggedInStudentData");
    return data ? JSON.parse(data) : null;
}

function getAuthToken() {
    return sessionStorage.getItem("authToken");
}

function logout() {
    sessionStorage.removeItem("loggedInStudent");
    sessionStorage.removeItem("loggedInStudentData");
    sessionStorage.removeItem("authToken");
}

function requireLogin() {
    if (getLoggedInStudent()) {
        return true;
    }

    const page = location.pathname.split("/").pop() || "index.html";
    location.replace(
        "student-login.html?next=" +
        encodeURIComponent(page + location.search)
    );

    return false;
}

document.addEventListener("DOMContentLoaded", function () {
    const id = getLoggedInStudent();
    const link = document.querySelector('nav a[href="student-login.html"]');

    if (id && link) {
        link.textContent = "Log Out (" + id + ")";
        link.href = "#";

        link.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
            location.href = "student-login.html";
        });
    }
});