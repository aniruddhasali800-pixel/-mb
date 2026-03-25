const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Content = require('../models/Content');
const User = require('../models/User');
const { createGridFSStorage, createDiskStorage, UPLOAD_DIRS } = require('../utils/storage');
const fs = require('fs-extra');

// Use Disk Storage for immediate availability (hybrid fallback serves it)
const storage = createDiskStorage();

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 * 1024, files: 1 }, // 5GB Limit
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|zip|javascript|json|text/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb(new Error('Only PDFs and ZIPs (for code) are allowed!'));
    }
});

// Get Platform Analytics (Hybrid)
router.get('/analytics', async (req, res) => {
    try {
        let totalUsers = 0;
        let pdfCount = 0;
        let codeCount = 0;
        let totalViews = 0;

        // 1. Get stats from MongoDB if connected
        if (req.app.get('mongoose_connected') !== false) {
            try {
                totalUsers = await User.countDocuments();
                pdfCount = await Content.countDocuments({ type: 'pdf' });
                codeCount = await Content.countDocuments({ type: 'code' });
                const viewsResult = await Content.aggregate([
                    { $group: { _id: null, total: { $sum: "$views" } } }
                ]);
                totalViews = viewsResult[0]?.total || 0;
            } catch (dbErr) {
                console.error('Analytics DB Fetch Error:', dbErr);
            }
        }

        // 2. Add local filesystem counts for files not in entries
        for (const [type, folderPath] of Object.entries(UPLOAD_DIRS)) {
            if (await fs.exists(folderPath)) {
                const files = await fs.readdir(folderPath);
                for (const filename of files) {
                    const stats = await fs.stat(path.join(folderPath, filename));
                    if (stats.isDirectory()) continue;

                    // Check if this file is likely already accounted for in DB
                    // (Matching the sync logic in /contents)
                    let isInDB = false;
                    if (req.app.get('mongoose_connected') !== false) {
                        isInDB = await Content.exists({ 
                            $or: [
                                { title: filename },
                                { fileUrl: `/api/admin/file/${filename}` }
                            ]
                        });
                    }

                    if (!isInDB) {
                        if (type === 'pdf') pdfCount++;
                        else if (type === 'code') codeCount++;
                    }
                }
            }
        }

        res.json({
            students: totalUsers,
            views: totalViews,
            pdfCount,
            codeCount,
            traffic: pdfCount + codeCount > 10 ? "High" : "Normal"
        });
    } catch (err) {
        console.error('ADMIN ANALYTICS ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

// Publish Content with Local & Cloud Sync
router.post('/publish', upload.single('file'), async (req, res) => {
    const { title, description, type, category, size, language, isFree, price } = req.body;
    
    try {
        if (!req.file) throw new Error('File upload failed');

        const fileUrl = `/api/admin/file/${req.file.filename}`;
        
        const contentData = {
            title: title || req.file.filename,
            description,
            type,
            category,
            fileUrl,
            size: size || (req.file.size ? (req.file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'),
            language,
            isFree: isFree === 'true' || isFree === true,
            price: Number(price) || 0,
            author: 'Admin'
        };

        // Attempt to save to MongoDB if connected
        if (req.app.get('mongoose_connected') !== false) {
            try {
                const newContent = new Content(contentData);
                await newContent.save();
                console.log('✅ Content metadata saved to MongoDB');
            } catch (dbErr) {
                console.error('⚠️ Could not save metadata to DB, will rely on sync:', dbErr.message);
            }
        }

        // Always save a local metadata file for persistence (Sidecar JSON)
        try {
            const metaPath = path.join(UPLOAD_DIRS[type === 'code' ? 'code' : 'pdf'], req.file.filename + '.json');
            await fs.writeJson(metaPath, contentData);
            console.log('✅ Local metadata sidecar saved:', req.file.filename + '.json');
        } catch (metaErr) {
            console.error('⚠️ Failed to save local metadata sidecar:', metaErr.message);
        }

        // Return success regardless, as the file is on disk and visible via hybrid listing
        res.status(201).json({
            ...contentData,
            message: 'Content published successfully (Local storage)'
        });
    } catch (err) {
        console.error('ADMIN PUBLISH ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

// Serve File from GridFS with local fallback
router.get('/file/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const bucket = req.app.get('gridfs');
        
        // Try GridFS first
        if (bucket) {
            const files = await bucket.find({ filename }).toArray();
            if (files && files.length > 0) {
                const ext = path.extname(filename).toLowerCase();
                if (ext === '.pdf') res.set('Content-Type', 'application/pdf');
                else if (ext === '.zip') res.set('Content-Type', 'application/zip');
                
                return bucket.openDownloadStreamByName(filename).pipe(res);
            }
        }

        // Fallback: Try Local Filesystem
        for (const [type, folderPath] of Object.entries(UPLOAD_DIRS)) {
            const filePath = path.join(folderPath, filename);
            if (await fs.exists(filePath)) {
                const ext = path.extname(filename).toLowerCase();
                if (ext === '.pdf') res.set('Content-Type', 'application/pdf');
                else if (ext === '.zip') res.set('Content-Type', 'application/zip');
                
                return fs.createReadStream(filePath).pipe(res);
            }
        }

        res.status(404).json({ message: 'File not found anywhere' });
    } catch (err) {
        console.error('FILE SERVE ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get All Content for Admin Dashboard (Hybrid: DB + Filesystem)
router.get('/contents', async (req, res) => {
    try {
        let contents = [];
        
        // 1. Try to get from MongoDB if connected
        if (req.app.get('mongoose_connected') !== false) {
            try {
                contents = await Content.find().sort({ createdAt: -1 });
            } catch (dbErr) {
                console.error('DB Fetch Error, falling back to FS only:', dbErr);
            }
        }

        // 2. Scan Filesystem for local files
        const localFiles = [];
        for (const [type, folderPath] of Object.entries(UPLOAD_DIRS)) {
            if (await fs.exists(folderPath)) {
                const files = await fs.readdir(folderPath);
                for (const filename of files) {
                    const filePath = path.join(folderPath, filename);
                    const stats = await fs.stat(filePath);
                    if (stats.isDirectory() || filename.endsWith('.json')) continue;

                    // Check if already in DB list (avoid duplicates)
                    const isAlreadyInDB = contents.some(c => c.fileUrl.endsWith(filename) || c.title === filename);
                    
                    if (!isAlreadyInDB) {
                        // Check for local metadata sidecar
                        let meta = {};
                        try {
                            const metaPath = filePath + '.json';
                            if (await fs.exists(metaPath)) {
                                meta = await fs.readJson(metaPath);
                            }
                        } catch (e) {}

                        localFiles.push({
                            _id: `fs-${filename}`, // Virtual ID
                            title: meta.title || filename.split('-').slice(1).join('-').replace(/\.(pdf|zip)$/, '').replace(/_/g, ' ') || filename,
                            description: meta.description || `Local file: ${filename}`,
                            type: type,
                            category: meta.category || (type === 'pdf' ? 'General Notes' : 'Project Code'),
                            fileUrl: `/api/admin/file/${filename}`,
                            size: meta.size || ((stats.size / (1024 * 1024)).toFixed(2) + ' MB'),
                            author: meta.author || 'System (Syncing...)',
                            price: meta.price || 0,
                            isFree: meta.isFree !== undefined ? meta.isFree : true,
                            createdAt: meta.createdAt || stats.birthtime
                        });
                    }
                }
            }
        }

        res.json([...contents, ...localFiles]);
    } catch (err) {
        console.error('ADMIN CONTENTS ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

// Delete Content
router.delete('/content/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // 1. Handle Virtual Local Files (fs- prefix)
        if (id.startsWith('fs-')) {
            const filename = id.replace('fs-', '');
            let deleted = false;

            for (const [type, folderPath] of Object.entries(UPLOAD_DIRS)) {
                const filePath = path.join(folderPath, filename);
                if (await fs.exists(filePath)) {
                    await fs.remove(filePath);
                    // Also remove sidecar metadata if exists
                    const metaPath = filePath + '.json';
                    if (await fs.exists(metaPath)) await fs.remove(metaPath);
                    deleted = true;
                }
            }
            
            if (deleted) return res.json({ message: 'Local content deleted successfully' });
            return res.status(404).json({ message: 'Local file not found' });
        }

        // 2. Handle Database Entries
        const content = await Content.findById(id);
        if (!content) return res.status(404).json({ message: 'Content not found' });

        // Delete from GridFS if it's a GridFS URL
        if (content.fileUrl.startsWith('/api/admin/file/')) {
            const filename = content.fileUrl.split('/').pop();
            const bucket = req.app.get('gridfs');
            if (bucket) {
                const files = await bucket.find({ filename }).toArray();
                if (files.length > 0) {
                    await bucket.delete(files[0]._id);
                }
            }
            
            // Also try to delete local file if it exists (for hybrid dual storage)
            for (const [type, folderPath] of Object.entries(UPLOAD_DIRS)) {
                const filePath = path.join(folderPath, filename);
                if (await fs.exists(filePath)) {
                    await fs.remove(filePath);
                    const metaPath = filePath + '.json';
                    if (await fs.exists(metaPath)) await fs.remove(metaPath);
                }
            }
        }

        await Content.findByIdAndDelete(id);
        res.json({ message: 'Content and file deleted successfully' });
    } catch (err) {
        console.error('ADMIN DELETE ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

// Update Price
router.put('/content/:id/price', async (req, res) => {
    try {
        const { isFree, price } = req.body;
        const updatedContent = await Content.findByIdAndUpdate(
            req.params.id,
            { isFree, price: Number(price) || 0 },
            { new: true }
        );
        if (!updatedContent) return res.status(404).json({ message: 'Content not found' });
        res.json(updatedContent);
    } catch (err) {
        console.error('ADMIN UPDATE PRICE ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
