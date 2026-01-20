# Xenia Backend 

A robust TypeScript backend API built with Express.js, MongoDB, and Winston logging, featuring secret key authentication and scalable architecture.

## 📑 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Logging](#logging)
- [Contributing](#contributing)

## ✨ Features

- **TypeScript**: Full type safety and modern JavaScript features
- **Secret Key Authentication**: Middleware-based API protection
- **Structured Logging**: Winston + Morgan for comprehensive request/error logging
- **MongoDB Integration**: Mongoose ODM for database operations
- **Error Handling**: Centralized error handling middleware
- **Service Layer Pattern**: Clean separation of concerns (Controllers → Services → Models)
- **CORS Enabled**: Cross-origin resource sharing configured
- **Environment-based Configuration**: Secure configuration management

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type-safe development |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **Winston** | Application logging |
| **Morgan** | HTTP request logging |
| **dotenv** | Environment variable management |

## 📁 Project Structure

```
xenia-backend/
├── src/
│   ├── config/
│   │   ├── db.ts              # MongoDB connection
│   │   └── logger.ts          # Winston logger configuration
│   ├── middleware/
│   │   ├── auth.ts            # Secret key authentication
│   │   ├── errorHandler.ts   # Global error handler
│   │   └── morganMiddleware.ts # HTTP request logger
│   ├── models/
│   │   └── User.ts            # User model schema
│   ├── controllers/
│   │   └── userController.ts # Request handlers
│   ├── routes/
│   │   └── userRoutes.ts     # API routes
│   ├── services/
│   │   └── userService.ts    # Business logic
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── server.ts             # Application entry point
├── logs/                      # Application logs (auto-generated)
├── .env                       # Environment variables
├── .gitignore
├── nodemon.json              # Nodemon configuration
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json             # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (or npm/yarn)
- **MongoDB** (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xenia-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=3002
   MONGO_URI=mongodb://localhost:27017/xenia
   SECRET_KEY=your-super-secure-secret-key-here
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

The server will start at `http://localhost:3002`

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `SECRET_KEY` | API authentication secret key | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Compile TypeScript to JavaScript |
| `pnpm start` | Run production build |
| `pnpm clean` | Remove compiled files |

## 🔌 API Endpoints

### Base URL
```
http://localhost:3002/api
```

### Authentication
All endpoints require the `x-secret-key` header with your secret key.

### User Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `GET` | `/` | Health check | - |
| `POST` | `/api/users` | Create a new user | `{ name, email, password }` |
| `GET` | `/api/users` | Get all users | - |
| `GET` | `/api/users/:id` | Get user by ID | - |

## 📊 Logging

The application uses **Winston** for logging with the following levels [web:49][web:52]:

- `error` ❌ - Error messages (logged to `logs/error.log`)
- `warn` ⚠️ - Warning messages
- `info` ✅ - Informational messages
- `http` 🌐 - HTTP requests (via Morgan)
- `debug` 🔍 - Debug messages (development only)

**Log Files:**
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

**Console Output Example:**
```
2026-01-02 11:30:00 info: 🚀 Server running on http://localhost:3000
2026-01-02 11:30:02 info: ✅ MongoDB Connected: cluster0.mongodb.net
2026-01-02 11:30:15 http: POST /api/users 201 145 - 98.45 ms
2026-01-02 11:30:15 info: ✅ User created successfully
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow conventional commits [web:60]:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

PICT CSI TEAM

## 🙏 Acknowledgments

- Built with Express.js and TypeScript
- Logging powered by Winston
- Database powered by MongoDB

---

**Made with ❤️ for Xenia**
