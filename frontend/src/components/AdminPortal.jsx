import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Code, Server, Shield, Activity, Users, FileDigit, Globe, Trash2, DollarSign, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AdminPortal = () => {
    const [stats, setStats] = useState({ students: 0, views: 0, pdfCount: 0, codeCount: 0, traffic: 'Low' });
    const [contents, setContents] = useState([]);

    // PDF Form State
    const [pdfStatus, setPdfStatus] = useState({ msg: '', type: '' });
    const [pdfData, setPdfData] = useState({ title: '', category: '', description: '', isFree: true, price: '' });
    const [pdfFile, setPdfFile] = useState(null);

    // Code Form State
    const [codeStatus, setCodeStatus] = useState({ msg: '', type: '' });
    const [codeData, setCodeData] = useState({ title: '', category: '', language: '', description: '' });
    const [codeFile, setCodeFile] = useState(null);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/analytics`);
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        }
    };

    const fetchContents = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/contents`);
            setContents(res.data);
        } catch (error) {
            console.error('Failed to fetch contents', error);
        }
    };

    const loadData = () => {
        fetchStats();
        fetchContents();
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this content?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/content/${id}`);
            loadData();
        } catch (error) {
            alert('Failed to delete content');
            console.error(error);
        }
    };

    const handleUpdatePrice = async (id, currentPrice) => {
        const newPrice = window.prompt(`Enter new price in $ (current: $${currentPrice || 0}). \nLeave empty or 0 to make it free.`, currentPrice || '');
        if (newPrice === null) return; // cancelled
        
        const priceNum = Number(newPrice);
        const isFree = isNaN(priceNum) || priceNum <= 0;

        try {
            await axios.put(`${API_BASE_URL}/api/admin/content/${id}/price`, {
                isFree,
                price: isFree ? 0 : priceNum
            });
            loadData();
        } catch (error) {
            alert('Failed to update price');
            console.error(error);
        }
    };

    const handlePdfPublish = async (e) => {
        e.preventDefault();
        setPdfStatus({ msg: 'Uploading PDF...', type: 'info' });
        
        if (!pdfFile) {
            return setPdfStatus({ msg: 'Please select a file to upload.', type: 'error' });
        }

        const formData = new FormData();
        formData.append('title', pdfData.title);
        formData.append('category', pdfData.category);
        formData.append('description', pdfData.description);
        formData.append('isFree', pdfData.isFree);
        formData.append('price', pdfData.price || 0);
        formData.append('type', 'pdf');
        formData.append('file', pdfFile);

        try {
            await axios.post(`${API_BASE_URL}/api/admin/publish`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPdfStatus({ msg: 'PDF published successfully!', type: 'success' });
            setPdfData({ title: '', category: '', description: '', isFree: true, price: '' });
            setPdfFile(null);
            loadData();
            setTimeout(() => setPdfStatus({ msg: '', type: '' }), 3000);
        } catch (error) {
            setPdfStatus({ msg: 'Failed to publish PDF.', type: 'error' });
            console.error(error);
        }
    };

    const handleCodePublish = async (e) => {
        e.preventDefault();
        setCodeStatus({ msg: 'Uploading Code...', type: 'info' });
        
        if (!codeFile) {
            return setCodeStatus({ msg: 'Please select a ZIP file to upload.', type: 'error' });
        }

        const formData = new FormData();
        formData.append('title', codeData.title);
        formData.append('category', codeData.category);
        formData.append('language', codeData.language);
        formData.append('description', codeData.description);
        formData.append('type', 'code');
        formData.append('file', codeFile);

        try {
            await axios.post(`${API_BASE_URL}/api/admin/publish`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setCodeStatus({ msg: 'Code published successfully!', type: 'success' });
            setCodeData({ title: '', category: '', language: '', description: '' });
            setCodeFile(null);
            loadData();
            setTimeout(() => setCodeStatus({ msg: '', type: '' }), 3000);
        } catch (error) {
            setCodeStatus({ msg: 'Failed to publish Code.', type: 'error' });
            console.error(error);
        }
    };

    return (
        <div className="bg-shapes" style={{ minHeight: '100vh', padding: '100px 5% 50px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Admin Control Center</h1>
                <p className="subtitle">Monitor platform growth and manage all published assets.</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="dashboard-container" style={{ marginTop: '0', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard icon={<Users />} label="Total Students" value={stats.students} trend="+12%" />
                <StatCard icon={<Eye />} label="Total Views" value={stats.views} trend="+24%" />
                <StatCard icon={<FileText />} label="Total PDFs/Notes" value={stats.pdfCount} trend="Active" />
                <StatCard icon={<Code />} label="Total Code Repos" value={stats.codeCount} trend="Active" />
            </div>

            {/* Dual Publishing Section */}
            <div style={{ maxWidth: '1200px', margin: '4rem auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* PDF Upload Form */}
                <div className="hub-card" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px', color: '#6366f1' }}>
                        <FileText size={24} /> Upload Notes & PDFs
                    </h2>
                    
                    <form onSubmit={handlePdfPublish}>
                        <div className="form-group">
                            <label>Content Title</label>
                            <input type="text" value={pdfData.title} onChange={(e) => setPdfData({...pdfData, title: e.target.value})} placeholder="e.g. Master React in 2024" required />
                        </div>
                        <div className="form-group">
                            <label>Category / Subject</label>
                            <input type="text" value={pdfData.category} onChange={(e) => setPdfData({...pdfData, category: e.target.value})} placeholder="e.g. Notes, Syllabus" required />
                        </div>
                        <div className="form-group">
                            <label>File (PDF only)</label>
                            <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} style={{ background: 'rgba(255,255,255,0.03)' }} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Pricing Status</label>
                                <select 
                                    value={pdfData.isFree} 
                                    onChange={(e) => setPdfData({...pdfData, isFree: e.target.value === 'true', price: e.target.value === 'true' ? '' : pdfData.price })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', outline: 'none' }}
                                >
                                    <option value="true">Free Content</option>
                                    <option value="false">Paid Premium</option>
                                </select>
                            </div>
                            {!pdfData.isFree && (
                                <div className="form-group">
                                    <label>Set Price ($)</label>
                                    <input 
                                        type="number" 
                                        value={pdfData.price} 
                                        onChange={(e) => setPdfData({...pdfData, price: e.target.value})} 
                                        placeholder="e.g. 15" 
                                        min="1"
                                        required={!pdfData.isFree} 
                                    />
                                </div>
                            )}
                        </div>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label>Short Description</label>
                            <textarea 
                                value={pdfData.description}
                                onChange={(e) => setPdfData({...pdfData, description: e.target.value})}
                                style={{ width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', color: 'white', resize: 'none', outline: 'none' }}
                                placeholder="Briefly describe the PDF..."
                            />
                        </div>

                        {pdfStatus.msg && (
                            <div style={{ margin: '1rem 0', color: pdfStatus.type === 'error' ? '#ef4444' : (pdfStatus.type === 'info' ? '#0ea5e9' : '#10b981'), display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {pdfStatus.type === 'error' ? <AlertCircle size={18} /> : (pdfStatus.type === 'info' ? <UploadCloud size={18} /> : <CheckCircle size={18} />)}
                                {pdfStatus.msg}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                            <UploadCloud size={18} /> Publish PDF
                        </button>
                    </form>
                </div>

                {/* Code Upload Form */}
                <div className="hub-card" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px', color: '#0ea5e9' }}>
                        <Code size={24} /> Upload Source Code & Programs
                    </h2>
                    
                    <form onSubmit={handleCodePublish}>
                        <div className="form-group">
                            <label>Project Title</label>
                            <input type="text" value={codeData.title} onChange={(e) => setCodeData({...codeData, title: e.target.value})} placeholder="e.g. E-Commerce Backend" required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Category</label>
                                <input type="text" value={codeData.category} onChange={(e) => setCodeData({...codeData, category: e.target.value})} placeholder="e.g. Full Stack App" required />
                            </div>
                            <div className="form-group">
                                <label>Primary Language</label>
                                <input type="text" value={codeData.language} onChange={(e) => setCodeData({...codeData, language: e.target.value})} placeholder="e.g. React, Node.js" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Source Code File (ZIP format)</label>
                            <input type="file" accept=".zip" onChange={(e) => setCodeFile(e.target.files[0])} style={{ background: 'rgba(255,255,255,0.03)' }} required />
                        </div>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label>Short Description</label>
                            <textarea 
                                value={codeData.description}
                                onChange={(e) => setCodeData({...codeData, description: e.target.value})}
                                style={{ width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', color: 'white', resize: 'none', outline: 'none' }}
                                placeholder="Describe the application features..."
                            />
                        </div>

                        {codeStatus.msg && (
                            <div style={{ margin: '1rem 0', color: codeStatus.type === 'error' ? '#ef4444' : (codeStatus.type === 'info' ? '#0ea5e9' : '#10b981'), display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {codeStatus.type === 'error' ? <AlertCircle size={18} /> : (codeStatus.type === 'info' ? <UploadCloud size={18} /> : <CheckCircle size={18} />)}
                                {codeStatus.msg}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', background: '#0ea5e9' }}>
                            <UploadCloud size={18} /> Publish Source Code
                        </button>
                    </form>
                </div>

            </div>

            {/* Content List Table */}
            <div className="hub-card" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <CheckCircle size={24} color="#10b981" /> Uploaded Assets & Revenue Tracking
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'white' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-gray)' }}>Title</th>
                                <th style={{ padding: '1rem', color: 'var(--text-gray)' }}>Type / Category</th>
                                <th style={{ padding: '1rem', color: 'var(--text-gray)' }}>Traffic (Views)</th>
                                <th style={{ padding: '1rem', color: 'var(--text-gray)' }}>Price</th>
                                <th style={{ padding: '1rem', color: 'var(--text-gray)' }}>Implied Revenue</th>
                                <th style={{ padding: '1rem', color: 'var(--text-gray)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contents.map((item) => (
                                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}><strong>{item.title}</strong></td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            background: item.type === 'pdf' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(14, 165, 233, 0.2)', 
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '8px'
                                        }}>
                                            {item.type.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>{item.category}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <Eye size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#94a3b8' }}/> 
                                        {item.views || 0}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {item.isFree ? <span style={{ color: '#10b981' }}>Free</span> : <span>${item.price}</span>}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 600 }}>
                                        ${(item.views || 0) * (item.price || 0)}
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleUpdatePrice(item._id, item.price)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 12px', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Set Price</button>
                                        <button onClick={() => handleDelete(item._id)} style={{ background: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {contents.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>No content uploaded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

const StatCard = ({ icon, label, value, trend }) => (
    <motion.div whileHover={{ y: -5 }} className="hub-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            {React.cloneElement(icon, { size: 32 })}
        </div>
        <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{value}</h3>
        <p style={{ color: 'var(--text-gray)', fontSize: '0.8rem', margin: '0' }}>{label}</p>
        <div style={{ color: trend.startsWith('+') ? '#10b981' : (trend === 'Active' ? '#0ea5e9' : '#94a3b8'), fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}>
            {trend}
        </div>
    </motion.div>
);

export default AdminPortal;
