# Premium Expense Tracker 💰

A full-stack, modern, and aesthetically pleasing web application to track your personal finances, set budgets, and analyze your spending habits.

![Expense Tracker](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)

## ✨ Features

- **Dynamic Dashboard**: Beautiful visual charts powered by Recharts to analyze your monthly spending.
- **Budget Management**: Set daily and monthly budget limits and get visual warnings when you exceed them.
- **Multi-Currency Support**: Switch between 11+ global currencies instantly, with live updates across the entire app.
- **Dark Mode**: Sleek, eye-friendly dark mode for night-time budgeting.
- **CSV Import/Export**: Easily migrate your data in and out of the platform.
- **Secure Authentication**: JWT-based user authentication to keep your financial data private.
- **Category Customization**: Create custom spending categories with personalized colors.

## 🚀 Tech Stack

### Frontend
- **React.js** (via Vite)
- **Framer Motion** (for smooth micro-animations)
- **Recharts** (for data visualization)
- **Lucide React** (for modern iconography)
- **Vitest** (for automated testing)

### Backend
- **FastAPI** (Python web framework)
- **SQLAlchemy** (ORM)
- **PostgreSQL / SQLite** (Database support)
- **Pytest** (for automated testing)
- **JWT** (Authentication)

## 🛠️ Local Development

### 1. Clone the repository
```bash
git clone https://github.com/manishm-2796/Premium-Expense-Tracker.git
cd Premium-Expense-Tracker
```

### 2. Start the Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (On Windows) or source venv/bin/activate (On Mac/Linux)
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

### 3. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

## 📦 Deployment

This project is configured for seamless deployment:
- **Frontend**: Deploy to [Vercel](https://vercel.com/) by pointing it to the `frontend/` directory.
- **Backend**: Deploy to [Render](https://render.com/) using the included `render.yaml` Blueprint, which automatically provisions a PostgreSQL database.

See the `.env.example` file for necessary environment variables.

## 🧪 Testing

The project includes comprehensive test suites for both frontend and backend.
```bash
# Run backend tests
cd backend && python -m pytest tests/

# Run frontend tests
cd frontend && npm run test -- --run
```
