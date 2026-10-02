# TaskManager Pro — Frontend Client

Enterprise Workspace & Task Management Client built with React 18, Vite 5, Tailwind CSS, and Context API.

## Features
- **4-in-1 Multi-View Engine**: Kanban Board (drag-and-drop), monthly Calendar timeline, high-density Table list, responsive Grid
- **Productivity Tools**: Command Palette (`Ctrl+K` / `⌘K`), subtask checklists with live progress bars, task-level commentary threads, and activity logs
- **Direct Authentication**: Instant registration and login without mandatory OTP barriers
- **Zero-Config Offline Demo**: Built-in mock data engine enabling immediate preview without an active backend
- **OWASP Hardened**: In-memory token storage (zero localStorage JWT tokens), strict Content Security Policy, and sanitized error boundaries

## Setup & Development
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

Run verification suite:
```bash
npm run build
node tests/run-all-tests.mjs
```
