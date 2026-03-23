import React from 'react';
import { motion } from 'framer-motion';
import { Code, Download, Eye, ArrowLeft, Search, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SourceCode = () => {
    const navigate = useNavigate();
    
    const [projects, setProjects] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        axios.get(`${API_BASE_URL}/api/admin/contents`)
            .then(res => {
                setProjects(res.data.filter(item => item.type === 'code'));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="bg-shapes" style={{ minHeight: '100vh', padding: '100px 5% 50px' }}>
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="back-btn"
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '2rem', fontWeight: 600 }}
            >
                <ArrowLeft size={20} /> Back to Hub
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '3rem' }}
            >
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Source Code</h1>
                <p className="subtitle">Download and explore complete source codes for various software projects.</p>
                
                <div style={{ maxWidth: '600px', margin: '2rem auto', position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="Search for projects, languages, or repos..." 
                        style={{ paddingLeft: '45px' }}
                    />
                    <Terminal size={18} style={{ position: 'absolute', left: '15px', top: '14px', color: '#94a3b8' }} />
                </div>
            </motion.div>

            <div className="dashboard-container" style={{ marginTop: '0' }}>
                {loading ? (
                    <p style={{ color: 'var(--text-gray)', textAlign: 'center', width: '100%' }}>Loading...</p>
                ) : projects.length === 0 ? (
                    <p style={{ color: 'var(--text-gray)', textAlign: 'center', width: '100%' }}>No projects available right now.</p>
                ) : projects.map((project, index) => (
                    <motion.div 
                        key={project._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hub-card"
                    >
                        <Code size={40} style={{ color: '#0ea5e9', marginBottom: '1.5rem' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', borderRadius: '20px', fontWeight: 600 }}>
                                {project.lang}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{project.size}</span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{project.title}</h3>
                        <p style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Repository by <span style={{ color: '#fff' }}>{project.author || 'Admin'}</span></p>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="hub-action" style={{ color: '#0ea5e9' }} onClick={() => window.open(`${API_BASE_URL}${project.fileUrl}`, '_blank')}>
                                <Eye size={16} /> View
                            </div>
                            <div className="hub-action" style={{ color: '#94a3b8' }} onClick={() => {
                                const link = document.createElement('a');
                                link.href = `${API_BASE_URL}${project.fileUrl}`;
                                link.download = project.title || 'download';
                                link.target = '_blank';
                                link.click();
                            }}>
                                <Download size={16} /> Download
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default SourceCode;
