# FreelanceFlow 🚀
A full-stack SaaS application built for freelancers to manage their business operations.

## 🌟 Live Demo
[Add live URL here]

## 📸 Screenshots
[Add screenshots here]

## ✨ Features
- 👥 Client Management - Add and manage all your clients
- 🧾 Invoice Generator - Create professional PDF invoices
- 💰 Payment Tracker - Track all payments received
- 💸 Expense Tracker - Track business expenses by category
- 📊 Dashboard & Analytics - Complete business overview with charts
- 🌍 Multi-language - English, French, Arabic (RTL support)
- 🌙 Dark/Light Mode - Theme preference saved automatically
- 🔐 Subscription Plans - Free trial, Pro, and Business plans
- 🖼️ Company Logo - Upload logo that appears on PDF invoices
- 🔒 Security - JWT auth, rate limiting, helmet, input sanitization

## 🛠️ Tech Stack
### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Zustand (state management)
- React Router v6
- Recharts (charts)
- i18next (multi-language)

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- SQLite (dev) / PostgreSQL (prod)
- JWT Authentication
- Helmet + Rate Limiting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

1. Clone the repository:
git clone https://github.com/webdevelopper00/freelanceflow.git
cd freelanceflow

2. Install dependencies:
npm install
cd client && npm install
cd ../server && npm install

3. Set up environment variables:
cp server/.env.example server/.env
cp client/.env.example client/.env

4. Set up database:
cd server
npx prisma migrate dev
npx tsx prisma/seed.ts

5. Start the application:
cd ..
Terminal 1: cd server && npm run dev
Terminal 2: cd client && npm run dev

6. Open browser at http://localhost:5173

### Test Account
- Email: test@test.com
- Password: password123

## 📁 Project Structure
freelanceflow/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared TypeScript types
└── .cursorrules     # Cursor AI rules

## 🔒 Security Features
- JWT tokens in httpOnly cookies
- Rate limiting on all endpoints
- Helmet.js security headers
- Input sanitization
- Audit logging
- Trial abuse prevention

## 📄 License
MIT License

## 👨‍💻 Author
Built with ❤️ using React, Node.js, and Cursor AI
