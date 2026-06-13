const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Middleware to check authentication (simple placeholder)
const requireAuth = async (req, res, next) => {
    // In a real app, verify JWT here
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = userId;
    next();
};

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'displayName email').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a post
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = new Post({ title, content, author: req.userId });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get a single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'displayName email');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upvote a post
router.post('/:id/upvote', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        if (!post.upvotes.includes(req.userId)) {
            post.upvotes.push(req.userId);
            // Remove from downvotes if exists
            post.downvotes = post.downvotes.filter(id => id.toString() !== req.userId);
            await post.save();
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Downvote a post
router.post('/:id/downvote', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        if (!post.downvotes.includes(req.userId)) {
            post.downvotes.push(req.userId);
            // Remove from upvotes if exists
            post.upvotes = post.upvotes.filter(id => id.toString() !== req.userId);
            await post.save();
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
