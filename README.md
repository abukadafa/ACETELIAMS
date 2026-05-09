# ACETEL Student Database Management System

A comprehensive cloud-based management system for ACETEL postgraduate students, providing robust administration, registry management, and academic tracking.

## Features

- 🔐 **Authentication System** - JWT-based auth with role-based access (Student, Facilitator, Admin)
- 📋 **Student Registry** - Comprehensive database of student records, enrollment status, and academic progress.
- 🎓 **Admissions Portal** - Manage student admissions and registrations.
- 📊 **Administrative Dashboard** - Overview of student demographics, enrollment trends, and academic metrics.
- 🎨 **Modern UI** - Built with React, Vanilla CSS, and responsive design.

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React + TypeScript + Vite
- React Router for navigation
- Vanilla CSS for styling
- Lucide React for icons

## Development Setup

### Option 1: Docker Development (Recommended)

1. **Prerequisites**
   - Docker Desktop installed and running

2. **Start the Application**
   ```bash
   cd docker
   docker compose -f docker-compose.dev.yml up --build
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Option 2: Local Manual Setup

#### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud instance)

#### Installation

1. **Setup Backend**
```bash
cd server
npm install
```

2. **Setup Frontend**
```bash
cd client
npm install
```

3. **Configure Environment**

Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/acetel-sdms
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

4. **Start Development Servers**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin/Facilitator)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Academic Events
- `GET /api/academic-events` - Get academic calendar/events

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components (AcetelDashboard, AdminManagement)
│   │   └── App.tsx        # Main app with routing
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Mongoose models (User, Course, AcademicEvent)
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Server entry
└── README.md
```

## License

MIT
