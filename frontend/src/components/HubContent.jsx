import React from 'react';
import { FileText, Code, Eye, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HubContent = () => {
    const navigate = useNavigate();
    const sections = [
        {
            title: "Notes & PDFs",
            icon: <FileText size={40} />,
            desc: "Access and manage all your study materials, PDF documents, and research notes in one place.",
            action: "See PDFs",
            path: "/assets"
        },
        {
            title: "Project Codes",
            icon: <Code size={40} />,
            desc: "Explore source code repositories, technical implementations, and collaborative project files.",
            action: "Source Code",
            path: "/source-code"
        },
        {
            title: "Community Discussions",
            icon: <FileText size={40} />,
            desc: "Join the community, read Reddit-style posts, and discuss technical topics.",
            action: "View Posts",
            path: "/posts"
        }
    ];

    return (
        <div className="dashboard-container">
            {sections.map((section, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hub-card"
                    onClick={() => navigate(section.path)}
                    style={{ cursor: 'pointer' }}
                >
                    {section.icon}
                    <h3>{section.title}</h3>
                    <p>{section.desc}</p>
                    <div className="hub-action">
                        {section.action === "See PDFs" ? <Eye size={16} /> : <Download size={16} />}
                        {section.action}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default HubContent;
