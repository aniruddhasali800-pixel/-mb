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
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Database connection check middleware
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1 && req.path.startsWith('/api') && 
        !req.path.startsWith('/api/admin/contents') && 
        !req.path.startsWith('/api/admin/file/') &&
        !req.path.startsWith('/api/admin/analytics') &&
        !req.path.startsWith('/api/admin/publish') &&
        !req.path.startsWith('/api/admin/content/')) {
        return res.status(503).json({ 
            message: 'Database is still connecting. Please wait a few seconds and refresh.',
            status: 'connecting'
        });
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
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB Atlas');
        app.set('mongoose_connected', true);
        
        const conn = mongoose.connection;
        const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'uploads'
        });
        app.set('gridfs', bucket); 
        console.log('✅ GridFS Bucket initialized');

        const { migrateExistingFiles } = require('./migrate_files_logic');
        migrateExistingFiles(bucket).catch(err => console.error('Migration Error:', err));

    } catch (err) {
        console.error('❌ Could not connect to MongoDB', err.message);
        app.set('mongoose_connected', false);
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

// Error Handler
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.status(500).json({ 
        message: err.message, 
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
});

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
