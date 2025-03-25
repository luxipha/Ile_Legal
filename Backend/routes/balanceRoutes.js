const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        res.json({
            email,
            balance: user ? user.balance : 0,
            purchaseHistory: user ? user.purchaseHistory : []
        });
    } catch (error) {
        console.error('Balance Check Error:', error);
        res.status(500).json({ error: 'Unable to retrieve balance' });
    }
});

module.exports = router;
