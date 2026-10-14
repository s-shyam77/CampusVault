# CampusVault — SQLite Full-Stack Hackathon Project

A student-focused academic resource hub built with React + Vite, Express, SQLite, JWT authentication, and local PDF uploads.

## Features
- Student registration and login (bcrypt password hashing + JWT)
- Roles: student, teacher, admin (admin role is assigned only through server environment config)
- Resource catalog with search, subject/category filters, downloads, bookmarks
- Upload PDF/DOC/DOCX/PPT/PPTX files (local storage, 10 MB limit)
- Questions and answers (Q&A)
- Admin moderation endpoints for resources
- Dashboard stats, responsive UI, seed resources
- SQLite database created automatically on server start

## Requirements
- Node.js 20+ recommended
- npm

## Run on Windows (PowerShell)
Open VS Code terminal in this project root.

### 1. Backend
```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```
The server runs at http://localhost:5000. SQLite database file is created automatically at `server/data/campusvault.db`.

Set a strong `JWT_SECRET` in `server/.env`. Optional `ADMIN_EMAIL` can be used to grant the admin role to that email during registration. Never commit `.env`.

### 2. Frontend (new terminal)
From the project root:
```powershell
cd client
npm install
npm run dev
```
Open the URL Vite shows, usually http://localhost:5173.

## Important
- This is a hackathon starter and should be security-tested before production.
- Uploaded files are stored under `server/uploads`; use persistent storage when deploying.
- SQLite is ideal for local demos/small deployments; choose a persistent-volume host. Serverless hosts with ephemeral filesystems may erase the DB/uploads.
- Admin registration is not open to everyone; set `ADMIN_EMAIL` on the server only.
