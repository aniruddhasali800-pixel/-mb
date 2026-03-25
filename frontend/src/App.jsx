import React from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react';
import Navbar from './components/Navbar';
import HubContent from './components/HubContent';
import Assets from './components/Assets';
import SourceCode from './components/SourceCode';
import AdminPortal from './components/AdminPortal';
import './App.css';

const App = () => {
    const { user } = useUser();

    return (
        <div className="bg-shapes">
            <SignedIn>
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
                                <p className="subtitle">Hello, {user?.firstName || user?.primaryEmailAddress?.emailAddress}! Explore your dashboard below.</p>
                            </motion.div>
                            <HubContent />
                        </>
                    } />
                    <Route path="/assets" element={<Assets />} />
                    <Route path="/source-code" element={<SourceCode />} />
                    <Route path="/admin-portal-xyz" element={<AdminPortal />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </SignedIn>

            <SignedOut>
                <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <SignIn />
                </div>
            </SignedOut>
        </div>
    );
};

export default App;
