import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Menu, X, Home, FileText, Code, MessageSquare, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user } = useUser();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!user) return null;

    const navItems = [
        { label: 'Hub', path: '/', icon: <Home size={18} /> },
        { label: 'PDFs & Notes', path: '/assets', icon: <FileText size={18} /> },
        { label: 'Source Codes', path: '/source-code', icon: <Code size={18} /> },
        { label: 'Discussions', path: '/posts', icon: <MessageSquare size={18} /> },
        { label: 'Admin', path: '/admin', icon: <Shield size={18} /> }
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="nav-brand" onClick={closeMenu} style={{ textDecoration: 'none' }}>
                    PDFs Hub
                </Link>

                {/* Desktop Navigation Links */}
                <div className="nav-links-desktop">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                className={`nav-link-item ${isActive ? 'active' : ''}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="nav-actions">
                    <div className="nav-user">
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
                    </div>
                    {/* Mobile Hamburger Menu Icon */}
                    <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle Menu">
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="mobile-drawer"
                    >
                        <div className="mobile-drawer-links">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link 
                                        key={item.path} 
                                        to={item.path} 
                                        className={`mobile-drawer-link ${isActive ? 'active' : ''}`}
                                        onClick={closeMenu}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;

