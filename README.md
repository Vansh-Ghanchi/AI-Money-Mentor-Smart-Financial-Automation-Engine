# Expense Tracker

A full-stack expense tracking application built with React, Node.js, Express, and MongoDB.

## Features

- 💰 Track expenses across multiple wallets
- 📊 Analytics and visualizations
- 🏢 Business account support with multi-user collaboration
- 📱 Responsive design (mobile & desktop)
- 🌙 Dark mode support
- 📄 Export data (CSV, PDF, JSON)
- 🔔 Subscription management
- 👥 Real-time member activity tracking
- 🔐 Secure authentication

## Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- Recharts for analytics
- Axios for API calls

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rathoddvansh28-cloud/Expense_Tracker.git
cd Expense_Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the development server:
```bash
npm run dev
```

The app will run on `http://localhost:5173` (frontend) and `http://localhost:5000` (backend).

## Project Structure

```
├── src/                  # Frontend React application
│   ├── components/       # Reusable components
│   ├── pages/           # Page components
│   ├── context/         # React context providers
│   └── services/        # API services
├── server/              # Backend Express application
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── middleware/      # Custom middleware
└── public/              # Static assets
```

## License

MIT
