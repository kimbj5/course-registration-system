# Course Registration System

A web-based course registration system for INFO 465 (VCU, Fall 2026). Students can log in, search the course catalog, view course details, and register for open sessions. The system keeps enrollment accurate and never lets a session go over capacity.

## Team

- Benedict Kim
- Ryan Brown
- Nathan Reinoehl
- Laci Allegra

## How the System Works

- Website: HTML, CSS, and JavaScript pages, served by the Express app.
- API: Node.js and Express (REST), running on Amazon EC2 with Amazon Linux 2023.
- Database: MySQL on Amazon RDS, in a private subnet that only the app server can reach.

The browser sends requests to the API. The API applies the rules, such as seat limits and no duplicate registrations, reads and writes the database, and sends the results back to the page.

## Database Scripts

- `course_registration_schema.sql` creates the database and its tables.
- `course_registration_data.sql` loads the test data.

Run the schema script first, then the data script.

## Local Setup

(Sprint 2 task T1.9)

## How We Work

### Branches

- `main` always works. It is the only branch deployed to AWS, and nobody commits to it directly.
- Every task gets its own branch, named after its task ID in the Sprint 2 plan, in lowercase with hyphens. Examples: `t1-7-api-project`, `2-2-search-page`.
- Before starting a task, get the latest `main` and create your branch from it.

### Commits

- Keep commits small, and start each message with the task ID. Example: `T1.7: Add database connection`.

### Pull Requests

- When a task is finished, open a pull request into `main`. Title it with the task ID and name, such as `T1.7: Set up API project`.
- In the description, say what changed and how to test it.
- One teammate must review and approve before merging. The reviewer checks that the code runs and that it completes the task.
- After approval, the author merges and deletes the branch.
- If `main` changed while you worked, bring the latest `main` into your branch and fix any conflicts before merging.

### Never Commit

- Passwords, the database endpoint, `.env` files, or `.pem` key files. This repository is public.
- The `node_modules` folder.

### Deployment

- Only `main` is deployed. Benedict pulls it onto the AWS server during team AWS sessions.

### Quick Reference (VS Code)

**1. Start a task**

- Click the branch name in the bottom-left corner of VS Code and choose `main`.
- Open Source Control (the branch icon on the left) and click **Sync Changes** to get the latest version.
- Click the branch name in the bottom-left again, choose **Create new branch**, and name it after your task, like `t1-7-api-project`.
- The bottom-left now shows your branch name. Always check it before you start working.

**2. Save your work**

- In Source Control, type a short message starting with your task ID, like `T1.7: Add database connection`.
- Click **Commit**. If it asks to stage all changes, click **Yes**.

**3. Upload your work**

- Click **Publish Branch** the first time, or **Sync Changes** after that.

**4. Finish the task**

- Open the repository on GitHub and click **Compare & pull request** on the yellow banner.
- Give it your task ID and name as the title, then click **Create pull request**.
- Ask a teammate to review it. After they approve, click **Merge**.
