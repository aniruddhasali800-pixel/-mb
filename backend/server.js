require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const User = require('./models/User');
const authRoutes = require('./routes/auth');

const app = express();

const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const { ensureDirs } = require('./utils/storage');

// Initialize directories
ensureDirs();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('true') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://192.168.')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Database connection check middleware
app.use((req, res, next) => {
    if (req.path.startsWith('/api') && 
        !req.path.startsWith('/api/admin/contents') && 
        !req.path.startsWith('/api/admin/file/') &&
        !req.path.startsWith('/api/admin/analytics') &&
        !req.path.startsWith('/api/admin/publish') &&
        !req.path.startsWith('/api/admin/content/')) {
        
        const state = mongoose.connection.readyState;
        if (state !== 1) {
            let status = 'connecting';
            let message = 'Database is still connecting. Please wait a few seconds and refresh.';
            
            if (state === 0) {
                status = 'disconnected';
                message = 'Database is disconnected. Please check backend logs.';
            } else if (state === 3) {
                status = 'disconnecting';
                message = 'Database is disconnecting.';
            }
            
            return res.status(503).json({ 
                message,
                status,
                readyState: state
            });
        }
    }
    next();
});

app.use(express.static('public'));
app.use('/data', express.static('data'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const connectDB = async () => {
    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 20000, // Increased timeout for Render/Atlas
            socketTimeoutMS: 45000,
            connectTimeoutMS: 20000,
        });
        console.log('✅ Connected to MongoDB Atlas');
        app.set('mongoose_connected', true);
        
        const conn = mongoose.connection;
        const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'uploads'
        });
        app.set('gridfs', bucket); 
        console.log('✅ GridFS Bucket initialized');

        // Optional: Run migration in background
        const { migrateExistingFiles } = require('./migrate_files_logic');
        migrateExistingFiles(bucket).catch(err => {
            console.error('❌ Migration Error:', err.message);
        });

    } catch (err) {
        console.error('❌ Could not connect to MongoDB:', err.message);
        if (err.message.includes('IP address')) {
            console.error('👉 TIP: Check your MongoDB Atlas IP Whitelist. Ensure 0.0.0.0/0 is allowed.');
        }
        app.set('mongoose_connected', false);
        
        // Retry connection after 5 seconds
        console.log('🔄 Retrying connection in 10 seconds...');
        setTimeout(connectDB, 10000);
    }
};

if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI is missing. Backend will operate in local-only mode.');
} else {
    connectDB();
}

// Passport Google Auth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER',
    callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User({
                googleId: profile.id,
                email: profile.emails[0].value,
                displayName: profile.displayName
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contacts', contactRoutes);

// Google Auth Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/?token=${req.user.id}`);
    });

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.status(500).json({ 
        message: err.message, 
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server is live on port ${PORT}`);
});

module.exports = app;


