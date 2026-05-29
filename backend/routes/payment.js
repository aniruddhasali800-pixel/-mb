const express = require('express');
const router = express.Router();
const stripeLib = require('stripe');
const Content = require('../models/Content');
const Purchase = require('../models/Purchase');

// Safely initialize Stripe
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('⚠️ STRIPE_SECRET_KEY is missing. Payment routes will be disabled.');
        return null;
    }
    return stripeLib(process.env.STRIPE_SECRET_KEY);
};

// Create a Checkout Session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const stripe = getStripe();
        if (!stripe) return res.status(503).json({ message: 'Stripe is not configured' });

        const { contentId, userId } = req.body;

        // Find content in database
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        if (content.isFree) {
            return res.status(400).json({ message: 'Content is free, no payment required' });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: content.title,
                            description: content.description,
                        },
                        unit_amount: Math.round(content.price * 100), // Stripe expects amounts in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${frontendUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/?canceled=true`,
            client_reference_id: userId,
            metadata: {
                contentId: contentId.toString(),
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error('PAYMENT ERROR:', err);
        res.status(500).json({ message: err.message });
    }
});

// Stripe Webhook (Signature verification happens here)
router.post('/webhook', async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(503).send('Stripe not configured');

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const userId = session.client_reference_id;
        const contentId = session.metadata.contentId;
        const amount = session.amount_total / 100;
        const stripeSessionId = session.id;

        try {
            const purchase = new Purchase({
                userId,
                contentId,
                stripeSessionId,
                amount,
                status: 'completed'
            });
            await purchase.save();
            console.log(`✅ Purchase recorded for user ${userId}, content ${contentId}`);
        } catch (dbErr) {
            console.error('Failed to save purchase to DB:', dbErr);
        }
    }

    res.json({received: true});
});

module.exports = router;
