import React from 'react';
import { Link } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';

const Navbar = () => {
    const { user } = useUser();

    if (!user) return null;

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '15px' }}>
                PDFs Hub
            </Link>
            <div className="nav-user">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
            </div>
        </nav>
    );
};

export default Navbar;


