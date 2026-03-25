require('dotenv').config();
const mongoose = require('mongoose');
const Content = require('./models/Content');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const contents = await Content.find({});
        console.log('Total Content found:', contents.length);
        contents.forEach(c => console.log(`- ${c.title} (${c.type}): ${c.fileUrl}`));
        process.exit(0);
    } catch (err) {
        console.error('DIAGNOSTIC ERROR:', err);
        process.exit(1);
    }
}

test();
