import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';

const Navbar = () => {
    const { user } = useUser();

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                PDFs Hub
            </div>
            <div className="nav-user">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
            </div>
        </nav>
    );
};

export default Navbar;
