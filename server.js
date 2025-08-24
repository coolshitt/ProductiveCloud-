const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/productive-cloud', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✅ Connected to MongoDB successfully!');
});

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Data Schema (for habits, CRM, etc.)
const dataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dataType: {
        type: String,
        required: true,
        enum: ['habits', 'crm', 'calendar', 'settings']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
});

const Data = mongoose.model('Data', dataSchema);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Productive Cloud Backend is running!' });
});

// User Registration
app.post('/api/auth/register', [
    body('username').isLength({ min: 3, max: 30 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save data (habits, CRM, etc.)
app.post('/api/data/save', authenticateToken, [
    body('dataType').isIn(['habits', 'crm', 'calendar', 'settings']),
    body('data').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { dataType, data } = req.body;
        const userId = req.user._id;

        // Find existing data or create new
        let existingData = await Data.findOne({ userId, dataType });
        
        if (existingData) {
            // Update existing data
            existingData.data = data;
            existingData.lastModified = new Date();
            existingData.version += 1;
            await existingData.save();
        } else {
            // Create new data
            existingData = new Data({
                userId,
                dataType,
                data,
                lastModified: new Date()
            });
            await existingData.save();
        }

        res.json({
            message: 'Data saved successfully!',
            data: existingData,
            timestamp: existingData.lastModified
        });

    } catch (error) {
        console.error('Save data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get data
app.get('/api/data/:dataType', authenticateToken, async (req, res) => {
    try {
        const { dataType } = req.params;
        const userId = req.user._id;

        const data = await Data.findOne({ userId, dataType });
        
        if (!data) {
            return res.json({ data: null, message: 'No data found' });
        }

        res.json({
            data: data.data,
            lastModified: data.lastModified,
            version: data.version
        });

    } catch (error) {
        console.error('Get data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all user data
app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const allData = await Data.find({ userId });

        const dataMap = {};
        allData.forEach(item => {
            dataMap[item.dataType] = {
                data: item.data,
                lastModified: item.lastModified,
                version: item.version
            };
        });

        res.json({
            data: dataMap,
            totalTypes: allData.length
        });

    } catch (error) {
        console.error('Get all data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete data
app.delete('/api/data/:dataType', authenticateToken, async (req, res) => {
    try {
        const { dataType } = req.params;
        const userId = req.user._id;

        const result = await Data.deleteOne({ userId, dataType });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.json({ message: 'Data deleted successfully!' });

    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sync data (for autosave)
app.post('/api/data/sync', authenticateToken, async (req, res) => {
    try {
        const { dataType, data, lastSync } = req.body;
        const userId = req.user._id;

        // Get current data from database
        const dbData = await Data.findOne({ userId, dataType });
        
        if (!dbData) {
            // Create new data if it doesn't exist
            const newData = new Data({
                userId,
                dataType,
                data,
                lastModified: new Date()
            });
            await newData.save();
            
            return res.json({
                action: 'created',
                data: newData,
                timestamp: newData.lastModified
            });
        }

        // Check if local data is newer
        if (lastSync && new Date(lastSync) < dbData.lastModified) {
            // Database has newer data
            return res.json({
                action: 'updated',
                data: dbData.data,
                timestamp: dbData.lastModified,
                version: dbData.version
            });
        } else {
            // Update database with local data
            dbData.data = data;
            dbData.lastModified = new Date();
            dbData.version += 1;
            await dbData.save();
            
            return res.json({
                action: 'synced',
                data: dbData,
                timestamp: dbData.lastModified
            });
        }

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Productive Cloud Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    console.log(`💾 Data endpoints: http://localhost:${PORT}/api/data/*`);
});
