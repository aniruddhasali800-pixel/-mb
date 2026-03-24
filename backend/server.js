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
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // For older file uploads
app.use('/data', express.static('data')); // For new data storage
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

let gridfsBucket;
mongoose.connection.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
});

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
    const user = await User.findById(id);
    done(null, user);
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
        // Successful authentication
        res.redirect('http://localhost:5000/?token=' + req.user.id);
    });

// API route to stream files from GridFS
app.get('/api/contents/file/:filename', async (req, res) => {
    try {
        const files = await gridfsBucket.find({ filename: req.params.filename }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ err: 'No file exists' });
        }
        gridfsBucket.openDownloadStreamByName(req.params.filename).pipe(res);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
