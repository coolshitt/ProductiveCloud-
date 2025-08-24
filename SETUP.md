# 🚀 Productive Cloud - Custom Database Setup Guide

This guide will help you set up a complete custom database system with authentication and autosave functionality for your Productive Cloud application.

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **MongoDB** (local installation or cloud service)
- **Git** (for version control)

## 🗄️ Database Setup

### Option 1: Local MongoDB Installation

1. **Install MongoDB Community Edition:**
   - **Windows:** Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - **macOS:** `brew install mongodb-community`
   - **Linux:** Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB Service:**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

3. **Verify Installation:**
   ```bash
   mongosh
   # You should see the MongoDB shell
   ```

### Option 2: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update the `MONGODB_URI` in your configuration

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
# Navigate to your project directory
cd /path/to/your/ProductiveCloud-project

# Install backend dependencies
npm install
```

### 2. Configure Environment

Create a `.env` file in your project root (or update `config.js`):

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/productive-cloud

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Security Configuration
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500
```

### 3. Start the Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

**Expected Output:**
```
🚀 Productive Cloud Backend running on port 5000
📊 Health check: http://localhost:5000/api/health
🔐 Auth endpoints: http://localhost:5000/api/auth/*
💾 Data endpoints: http://localhost:5000/api/data/*
✅ Connected to MongoDB successfully!
```

## 🌐 Frontend Integration

### 1. Update Your Main Page

Add the autosave script to your `index.html`:

```html
<!-- Add this before closing </body> tag -->
<script src="autosave.js"></script>
```

### 2. Authentication Flow

1. **First-time users:** Start at `login.html`
2. **Returning users:** Automatically redirected to `index.html` if authenticated
3. **Logout:** Clear `authToken` from localStorage

### 3. Autosave Integration

The autosave system automatically:
- Syncs data every 30 seconds
- Handles offline/online transitions
- Manages data conflicts
- Provides real-time updates

## 🧪 Testing the System

### 1. Test Backend Health

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Productive Cloud Backend is running!"
}
```

### 2. Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Test Data Sync

```bash
# Get auth token from login response
TOKEN="your-jwt-token-here"

# Save habits data
curl -X POST http://localhost:5000/api/data/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "dataType": "habits",
    "data": {
      "habits": [
        {
          "id": "1",
          "name": "Morning Exercise",
          "category": "health"
        }
      ]
    }
  }'
```

## 🔐 Security Features

- **Password Hashing:** Bcrypt with 12 salt rounds
- **JWT Tokens:** 7-day expiration
- **Rate Limiting:** 100 requests per 15 minutes
- **Input Validation:** Sanitized and validated
- **CORS Protection:** Configurable origins
- **Helmet Security:** HTTP security headers

## 📱 Demo Account

A demo account is automatically created for testing:

- **Email:** `demo@productivecloud.com`
- **Password:** `demo123`

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check if MongoDB is running
   sudo systemctl status mongod
   
   # Check connection string
   mongodb://localhost:27017/productive-cloud
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

3. **CORS Errors**
   - Update `CORS_ORIGIN` in config
   - Ensure frontend URL is included

4. **Authentication Failed**
   - Check JWT_SECRET in config
   - Verify token expiration
   - Check Authorization header format

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
export DEBUG=productive-cloud:*

# Or add to your .env file
DEBUG=productive-cloud:*
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Data Management
- `POST /api/data/save` - Save data
- `GET /api/data/:dataType` - Get specific data
- `GET /api/data` - Get all user data
- `DELETE /api/data/:dataType` - Delete data
- `POST /api/data/sync` - Sync data (autosave)

### System
- `GET /api/health` - Health check

## 📊 Data Structure

### User Schema
```javascript
{
  username: String (3-30 chars, unique),
  email: String (unique, validated),
  password: String (hashed, min 6 chars),
  createdAt: Date,
  lastLogin: Date
}
```

### Data Schema
```javascript
{
  userId: ObjectId (ref: User),
  dataType: String (habits|crm|calendar|settings),
  data: Mixed (any JSON data),
  lastModified: Date,
  version: Number
}
```

## 🚀 Production Deployment

### 1. Environment Variables
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/productive-cloud
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://yourdomain.com
```

### 2. Process Manager
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "productive-cloud"

# Monitor
pm2 monit

# Logs
pm2 logs productive-cloud
```

### 3. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Monitoring & Analytics

### 1. Database Monitoring
- MongoDB Compass for visual database management
- MongoDB Atlas for cloud monitoring

### 2. Application Monitoring
- PM2 for process management
- Built-in logging for debugging
- Health check endpoint for uptime monitoring

## 🔮 Future Enhancements

- **Real-time Sync:** WebSocket integration
- **File Uploads:** Image/document storage
- **User Roles:** Admin/user permissions
- **Data Export:** CSV/PDF generation
- **Backup System:** Automated backups
- **Analytics:** Usage statistics

## 📞 Support

If you encounter issues:

1. Check the console logs
2. Verify MongoDB connection
3. Test API endpoints individually
4. Check browser network tab
5. Review this setup guide

## 🎉 Success!

Once everything is working:

- ✅ Backend server running on port 5000
- ✅ MongoDB connected successfully
- ✅ Frontend authentication working
- ✅ Autosave system active
- ✅ Data syncing automatically

Your Productive Cloud application now has a robust, scalable backend with real-time data synchronization!
