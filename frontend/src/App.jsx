import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, LogOut, Chrome } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HubContent from './components/HubContent';
import Assets from './components/Assets';
import SourceCode from './components/SourceCode';
import AdminPortal from './components/AdminPortal';
import { API_BASE_URL } from './config';
import './App.css';

const API_URL = `${API_BASE_URL}/api/auth`;

const App = () => {
    const { user, login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Handle Google OAuth redirect
        const urlParams = new URLSearchParams(window.location.search);
        const googleToken = urlParams.get('token');
        if (googleToken) {
            login(googleToken, { displayName: 'Google User', email: 'Authenticated via Google' });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [login]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/login' : '/register';
            const payload = isLogin ? { email, password } : { displayName: name, email, password };
            
            const response = await axios.post(`${API_URL}${endpoint}`, payload);
            login(response.data.token, response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    };

    if (user) {
        return (
            <div className="bg-shapes">
                <Navbar />
                <Routes>
                    <Route path="/" element={
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ paddingTop: '100px', textAlign: 'center' }}
                            >
                                <h1>Welcome to PDFs Hub!</h1>
                                <p className="subtitle">Hello, {user.displayName || user.email}! Explore your dashboard below.</p>
                            </motion.div>
                            <HubContent />
                        </>
                    } />
                    <Route path="/assets" element={<Assets />} />
                    <Route path="/source-code" element={<SourceCode />} />
                    <Route path="/admin-portal-xyz" element={<AdminPortal />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        );
    }

    return (
        <div className="bg-shapes">
            <AnimatePresence mode="wait">
                <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                    transition={{ duration: 0.4 }}
                    className="auth-card"
                >
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p className="subtitle">
                        {isLogin ? 'Enter your credentials to access your account' : 'Get started with your free account today'}
                    </p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <label>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        placeholder="John Doe" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required 
                                    />
                                    <UserIcon size={16} style={{ position: 'absolute', right: '15px', top: '14px', color: '#94a3b8' }} />
                                </div>
                            </div>
                        )}
                        <div className="form-group">
                            <label>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                                <Mail size={16} style={{ position: 'absolute', right: '15px', top: '14px', color: '#94a3b8' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                                <Lock size={16} style={{ position: 'absolute', right: '15px', top: '14px', color: '#94a3b8' }} />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <button className="btn-google" onClick={handleGoogleLogin}>
                        <Chrome size={18} /> Continue with Google
                    </button>

                    <p className="footer-text">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Create account' : 'Sign in'}
                        </span>
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default App;
