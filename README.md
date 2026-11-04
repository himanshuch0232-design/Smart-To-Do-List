# Smart To-Do List – Cloud-Based Task Management Website

A modern, premium-looking, fully functional task management web application developed as a **BCA Cloud Computing** academic project.

## Features

### Design & UX
- Premium blue, white & soft grey colour palette
- Glass-style cards with subtle shadows
- Clean Inter typography + Font Awesome icons
- Smooth hover effects & transitions
- Fully responsive (mobile, tablet, desktop)
- Light & Dark themes with persistence
- Collapsible / mobile sidebar navigation

### Pages
1. **Landing Page** – Hero, features, how it works, cloud tech section, footer
2. **Authentication**
   - User Registration (name, email, password validation)
   - Login
   - Forgot Password (demo recovery)
   - Secure logout
   - User-specific data isolation
3. **Dashboard**
   - Overview with stats cards (Total, Completed, Pending, Overdue)
   - Completion percentage ring
   - Weekly productivity chart (Chart.js)
   - Recent tasks & Upcoming deadlines
   - Daily productivity summary
4. **Task Management**
   - Create / Edit / Delete tasks
   - Title, Description, Due Date, Due Time
   - Priority: High / Medium / Low
   - Categories: Personal, Work, Study, Health, Other
   - Mark complete / incomplete
   - Filters by priority, category, status
   - Search
5. **Views**
   - My Tasks (all)
   - Today
   - Upcoming
   - Calendar (interactive month view)
   - Completed
   - Categories overview
   - Settings (profile, theme, clear data)

### Cloud Computing Concepts Demonstrated
- Client-side data persistence (simulating cloud storage via localStorage)
- User authentication & session management
- Multi-tenant data isolation (`tasks_<userId>`)
- Responsive, cloud-ready frontend architecture
- Secure logout & protected routes

## How to Run

1. Open the project folder in any modern browser or local server.
2. Start with `index.html`.
3. Create an account → Login → Start managing tasks.

> **Tip:** For best experience use a local server (e.g. VS Code Live Server, or `python -m http.server`).

## Tech Stack

- HTML5 + Tailwind CSS (CDN)
- Vanilla JavaScript (ES6+)
- Chart.js for analytics
- Font Awesome 6
- Google Fonts (Inter)
- localStorage (cloud storage simulation)

## Project Structure

```
smart-todo-list/
├── index.html              # Landing page
├── login.html              # Login
├── register.html           # Registration
├── forgot-password.html    # Password recovery
├── dashboard.html          # Main application
├── js/
│   └── app.js              # Core application logic
└── README.md
```

## Academic Notes

This project is designed to look and feel like a real commercial SaaS product (inspired by Notion, Todoist, ClickUp) while remaining fully self-contained for demonstration and evaluation purposes.

---

**BCA Cloud Computing Academic Project 2025-26**
