const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    stripeSessionId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', PurchaseSchema);
