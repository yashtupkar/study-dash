# 🎯 N-Day Study Dashboard (MERN Stack)

A modern, minimal, responsive Study Dashboard built for preparing for **SSC CGL 2026** and **Coal India MT (Computer Science) 2026**. Styled with a Notion/Linear aesthetic, supporting Dark/Light modes, dynamic timeline configurations (30, 45, 60, 90 days), and locked study cell checks.

---

## 🧱 Features & Rules
- **Timeline Scaling**: Alter your start date and target days (e.g. 30, 45, 60, 90 days) dynamically.
- **Study Checklist Locking**: Daily checkbox cells can only be updated for today's date based on your start date. Past and future days are locked.
- **Performance Graphs**: Score and accuracy progress plotted on double-axis line charts.
- **GitHub Heatmap**: Visual contribution squares indicating logged study hours.
- **Full Syllabus Seeded**: Auto-populated with 34 Quant topics, 26 Reasoning topics, 20 English topics, 25 General Awareness topics, and 40 Computer Science topics.
- **Backup Support**: Export your complete study tree as JSON and import backups.

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017/study-dash` (or a remote MongoDB Atlas URI)

### 1. Database Seeding
Open a terminal in the `/server` directory and run:
```bash
cd server
npm install
npm run seed
```
This connects to your MongoDB database, clears existing subjects, and populates the database with the complete study curriculum.

### 2. Run the Express Backend
From the `/server` directory, run:
```bash
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 3. Run the React Frontend
Open a new terminal in the `/client` directory and run:
```bash
cd client
npm install
npm run dev
```
The Vite development server runs on `http://localhost:3000` (which automatically proxies api requests to `http://localhost:5000`).

---

## 📂 Project Structure
```
/client                  → React + Vite frontend
  /src
    /context/AppContext.jsx → Auth & study state manager
    /components          → Dashboard, Subjects, Heatmap, Mocks, Stats, Notes, Settings
/server                  → Express API
  /models                → Mongoose Schemas (User, Subject, TopicProgress, DayLog, Mock, Note, TodayTask)
  /routes                → API Router definitions
  /middleware/auth.js    → JWT protection middleware
  /seed.js               → Database seeding curriculum script
```

---

## 🔑 Environment Variables
Create a `.env` in both folders.
- **Server `.env`**:
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/study-dash
  JWT_SECRET=supersecretstudydashkey123
  ```
- **Client `.env`**:
  ```env
  VITE_API_URL=http://localhost:5000
  ```
