const fs = require('fs-extra');
const path = require('path');
const Content = require('./models/Content');

const UPLOAD_DIRS = {
    pdf: path.join(__dirname, 'data/all data storage'),
    code: path.join(__dirname, 'data/project data storage')
};

async function migrateExistingFiles(bucket) {
    console.log('🔄 Starting auto-migration for local files...');
    
    // Migrate PDFs
    await migrateFolder(UPLOAD_DIRS.pdf, 'pdf', bucket);
    
    // Migrate Code
    await migrateFolder(UPLOAD_DIRS.code, 'code', bucket);
    
    console.log('✅ Auto-migration check finished.');
}

async function migrateFolder(folderPath, type, bucket) {
    if (!await fs.exists(folderPath)) return;
    
    const files = await fs.readdir(folderPath);
    for (const filename of files) {
        const filePath = path.join(folderPath, filename);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory() || filename.endsWith('.json')) continue;

        // Check if already in DB or GridFS
        const existing = await Content.findOne({ 
            $or: [
                { title: filename },
                { fileUrl: `/api/admin/file/${filename}` }
            ] 
        });
        
        if (existing) continue;

        console.log(`- Auto-migrating: ${filename}`);

        // Read metadata sidecar if exists
        let meta = {};
        try {
            const metaPath = filePath + '.json';
            if (await fs.exists(metaPath)) {
                meta = await fs.readJson(metaPath);
            }
        } catch (e) {}

        // Upload to GridFS
        const uploadStream = bucket.openUploadStream(filename);
        const fileStream = fs.createReadStream(filePath);
        
        await new Promise((resolve, reject) => {
            fileStream.pipe(uploadStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        // Create Content entry
        const newContent = new Content({
            title: meta.title || filename.split('-').slice(1).join('-').replace(/\.pdf$/, '').replace(/_/g, ' ') || filename,
            description: meta.description || `Imported material: ${filename}`,
            type: meta.type || type,
            category: meta.category || (type === 'pdf' ? 'General Notes' : 'Project Code'),
            fileUrl: `/api/admin/file/${filename}`,
            size: meta.size || ((stats.size / (1024 * 1024)).toFixed(2) + ' MB'),
            author: meta.author || 'Admin',
            price: meta.price || 0,
            isFree: meta.isFree !== undefined ? meta.isFree : true
        });

        await newContent.save();
        console.log(`  ✅ ${filename} synced to MongoDB with metadata`);
    }
}

module.exports = { migrateExistingFiles };
