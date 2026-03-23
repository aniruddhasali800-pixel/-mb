import React, { useState } from 'react';
import { LogOut, User, Settings, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                PDFs Hub
            </div>
            <div className="nav-user" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="nav-avatar">
                    {(user.displayName || user.email)[0].toUpperCase()}
                </div>
                
                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="dropdown-menu"
                        >
                            <div className="dropdown-item">
                                <User size={16} /> Profile
                            </div>
                            <div className="dropdown-item">
                                <Settings size={16} /> Settings
                            </div>
                            <div className="dropdown-item">
                                <Shield size={16} /> Admin
                            </div>
                            <div className="dropdown-item" onClick={logout} style={{ color: '#ef4444' }}>
                                <LogOut size={16} /> Logout
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;
