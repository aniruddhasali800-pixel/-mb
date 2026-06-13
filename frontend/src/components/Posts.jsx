import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const Posts = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/posts`)
            .then(res => {
                setPosts(res.data);
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
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Community Discussions</h1>
                <p className="subtitle">Join the conversation with other students and developers.</p>
            </motion.div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {loading ? (
                    <p style={{ color: 'var(--text-gray)', textAlign: 'center', width: '100%' }}>Loading...</p>
                ) : posts.length === 0 ? (
                    <p style={{ color: 'var(--text-gray)', textAlign: 'center', width: '100%' }}>No posts available right now.</p>
                ) : posts.map((post, index) => (
                    <motion.div 
                        key={post._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hub-card"
                        style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', width: '40px' }}>
                            <ThumbsUp size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                            <span style={{ fontWeight: 'bold' }}>{(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}</span>
                            <ThumbsDown size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Posted by {post.author?.displayName || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString()}</span>
                            <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>{post.title}</h3>
                            <p style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '1rem' }}>{post.content}</p>
                            
                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#94a3b8' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <MessageSquare size={16} /> Comments
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Posts;
