const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');

const UPLOAD_DIRS = {
    pdf: path.join(__dirname, '../data/all data storage'),
    code: path.join(__dirname, '../data/project data storage')
};

const ensureDirs = async () => {
    try {
        await fs.ensureDir(UPLOAD_DIRS.pdf);
        await fs.ensureDir(UPLOAD_DIRS.code);
        console.log('✅ Local upload directories verified (serving as fallback)');
    } catch (err) {
        console.error('❌ Failed to create upload directories:', err);
    }
};

// GridFS Storage for MongoDB Atlas persistence
const createGridFSStorage = (url) => {
    return new GridFsStorage({
        url: url,
        file: (req, file) => {
            return new Promise((resolve, reject) => {
                crypto.randomBytes(16, (err, buf) => {
                    if (err) return reject(err);
                    const filename = buf.toString('hex') + path.extname(file.originalname);
                    const fileInfo = {
                        filename: filename,
                        bucketName: 'uploads' // Collection name: uploads.files and uploads.chunks
                    };
                    resolve(fileInfo);
                });
            });
        }
    });
};

// Local Disk Storage for immediate availability and fallback
const createDiskStorage = () => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const type = req.body.type === 'code' ? 'code' : 'pdf';
            const dest = UPLOAD_DIRS[type];
            console.log(`📂 Upload Destination: ${dest} for type ${type}`);
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
};

module.exports = { UPLOAD_DIRS, ensureDirs, createGridFSStorage, createDiskStorage };
