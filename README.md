# Backend Template

A comprehensive Node.js backend template built with TypeScript, Express.js, MongoDB, and modern best practices. This template provides a solid foundation for building scalable REST APIs with authentication, file uploads, comprehensive error handling, and more.

## 🚀 Features

- **TypeScript** - Full TypeScript support with strict type checking
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Authentication & Authorization** - JWT-based auth with refresh tokens
- **File Upload** - Cloudinary integration for image/file uploads
- **Input Validation** - Zod schema validation
- **Error Handling** - Centralized error handling with custom error classes
- **Logging** - Winston logger with request tracking
- **Security** - Helmet, CORS, rate limiting, input sanitization
- **API Documentation** - Built-in API documentation endpoint
- **Environment Configuration** - Comprehensive environment variable setup
- **Code Quality** - ESLint, Prettier, and pre-commit hooks
- **Testing Ready** - Structure ready for unit and integration tests

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/backend-template
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   
   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   
   # Cloudinary Configuration (Optional)
   ENABLE_CLOUDINARY=true
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Email Configuration (Optional)
   EMAIL_FROM=noreply@yourapp.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Redis Configuration (Optional)
   REDIS_URL=redis://localhost:6379
   
   # Application URLs
   CLIENT_URL=http://localhost:3000
   SERVER_URL=http://localhost:5000
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start the application**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
src/
├── app/
│   └── modules/
│       ├── auth/                 # Authentication module
│       │   ├── auth.controller.ts
│       │   ├── auth.interface.ts
│       │   ├── auth.routes.ts
│       │   ├── auth.service.ts
│       │   └── auth.validation.ts
│       └── user/                 # User module
│           ├── user.controller.ts
│           ├── user.interface.ts
│           ├── user.model.ts
│           ├── user.routes.ts
│           ├── user.service.ts
│           └── user.validation.ts
├── config/
│   ├── database.ts              # Database configuration
│   └── index.ts                 # Configuration exports
├── middlewares/
│   ├── auth.ts                  # Authentication middleware
│   ├── errorHandler.ts          # Error handling middleware
│   ├── requestLogger.ts         # Request logging middleware
│   ├── upload.ts                # File upload middleware
│   └── validateRequest.ts       # Request validation middleware
├── routes/
│   └── index.ts                 # Main routes file
├── services/
│   └── cloudinary.service.ts    # Cloudinary service
├── shared/
│   ├── constants.ts             # Application constants
│   └── errors.ts                # Custom error classes
├── types/
│   ├── express.d.ts             # Express type extensions
│   └── index.ts                 # Type definitions
├── utils/
│   ├── encryption.ts            # Encryption utilities
│   ├── jwt.ts                   # JWT utilities
│   ├── logger.ts                # Winston logger setup
│   ├── response.ts              # Response utilities
│   └── validation.ts            # Validation utilities
├── app.ts                       # Express app configuration
└── server.ts                    # Server entry point
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build the application
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking

# Testing (when implemented)
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Utilities
npm run clean        # Clean build directory
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication with the following endpoints:

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

### Protected Routes
For protected routes, include the JWT token in the Authorization header:
```http
Authorization: Bearer your-jwt-token-here
```

## 📝 API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/logout` | User logout | Yes |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | No |
| POST | `/api/v1/auth/forgot-password` | Request password reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password | No |
| POST | `/api/v1/auth/verify-email` | Verify email address | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### User Endpoints
| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/v1/users` | Get all users | Yes | Yes |
| GET | `/api/v1/users/:id` | Get user by ID | Yes | No |
| PATCH | `/api/v1/users/profile` | Update profile | Yes | No |
| PATCH | `/api/v1/users/change-password` | Change password | Yes | No |
| POST | `/api/v1/users/avatar` | Upload avatar | Yes | No |
| DELETE | `/api/v1/users/:id` | Delete user | Yes | Yes |
| GET | `/api/v1/users/stats` | Get user statistics | Yes | Yes |

### System Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/api/health` | Detailed health check |
| GET | `/api/docs` | API documentation |

## 📤 File Upload

The API supports file uploads using Cloudinary. Configure your Cloudinary credentials in the `.env` file.

### Upload Avatar
```http
POST /api/v1/users/avatar
Authorization: Bearer your-jwt-token-here
Content-Type: multipart/form-data

avatar: [file]
```

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Spreadsheets**: XLS, XLSX, CSV
- **Videos**: MP4, MPEG, QuickTime, WebM
- **Audio**: MP3, WAV, OGG, AAC

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Sanitization**: MongoDB injection prevention
- **Parameter Pollution**: HPP protection
- **JWT Security**: Secure token handling
- **Password Hashing**: bcrypt password hashing
- **Input Validation**: Zod schema validation

## 📊 Logging

The application uses Winston for comprehensive logging:

- **Console Logging**: Development environment
- **File Logging**: Production environment
- **Error Logging**: Separate error log files
- **Request Logging**: HTTP request/response logging
- **Structured Logging**: JSON format for easy parsing

## 🔍 Error Handling

Centralized error handling with custom error classes:

- **ApiError**: Base API error class
- **BadRequestError**: 400 Bad Request
- **UnauthorizedError**: 401 Unauthorized
- **ForbiddenError**: 403 Forbidden
- **NotFoundError**: 404 Not Found
- **ConflictError**: 409 Conflict
- **ValidationError**: 422 Unprocessable Entity
- **InternalServerError**: 500 Internal Server Error

## 🧪 Testing

The project structure is ready for testing. Recommended testing stack:

- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **MongoDB Memory Server**: In-memory MongoDB for testing

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest supertest @types/supertest mongodb-memory-server

# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Environment Variables for Production

Ensure all required environment variables are set:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
# ... other variables
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
```

### Heroku Deployment

1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set NODE_ENV=production`
4. Deploy: `git push heroku main`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Run tests and linting: `npm run lint && npm test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help with setup, please:

1. Check the [documentation](#-api-endpoints)
2. Review the [troubleshooting section](#-troubleshooting)
3. Open an issue on GitHub
4. Contact the maintainers

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
- Ensure MongoDB is running locally or check your MongoDB Atlas connection string
- Verify the `MONGODB_URI` in your `.env` file

**JWT Secret Error**
```
Error: JWT_SECRET is required
```
- Make sure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in your `.env` file
- Use strong, unique secrets for production

**Port Already in Use**
```
Error: listen EADDRINUSE :::5000
```
- Change the `PORT` in your `.env` file
- Kill the process using the port: `lsof -ti:5000 | xargs kill -9`

**Cloudinary Upload Error**
```
Error: Must supply cloud_name
```
- Set up your Cloudinary credentials in the `.env` file
- Set `ENABLE_CLOUDINARY=true` if you want to use file uploads

## 🎯 Roadmap

- [ ] Add comprehensive unit and integration tests
- [ ] Implement Redis caching
- [ ] Add email service integration
- [ ] Implement real-time features with Socket.io
- [ ] Add API versioning
- [ ] Implement database migrations
- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement background job processing
- [ ] Add monitoring and metrics
- [ ] Implement multi-tenancy support

---

**Built with ❤️ using Node.js, TypeScript, and Express.js**