const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Middleware to check authentication
const requireAuth = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = userId;
    next();
};

// Get comments for a specific post
router.get('/post/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .populate('author', 'displayName email')
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a comment
router.post('/post/:postId', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const { content } = req.body;
        const comment = new Comment({
            content,
            post: req.params.postId,
            author: req.userId
        });
        await comment.save();
        res.status(201).json(comment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
