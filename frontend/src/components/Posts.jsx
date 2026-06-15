import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import AdBanner from './AdBanner';

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
            <AdBanner />
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
                        className="post-card"
                    >
                        <div className="post-votes-sidebar">
                            <ThumbsUp size={20} className="vote-btn" />
                            <span className="vote-count">{(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}</span>
                            <ThumbsDown size={20} className="vote-btn" />
                        </div>
                        <div className="post-main-content">
                            <span className="post-meta">Posted by <span className="post-author">{post.author?.displayName || 'Unknown'}</span> • {new Date(post.createdAt).toLocaleDateString()}</span>
                            <h3 className="post-title-link">{post.title}</h3>
                            <p className="post-text">{post.content}</p>
                            
                            <div className="post-actions">
                                <div className="post-action-item">
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
