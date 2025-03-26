const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TokenSupply = require('../models/TokenSupply');

router.get('/', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        const supply = await TokenSupply.findOne();

        res.json({
            email,
            balance: user ? user.balance : 0,
            purchaseHistory: user ? user.purchaseHistory : [],
            remainingSupply: supply ? supply.remainingSupply : 0
        });

    } catch (error) {
        console.error('Balance Check Error:', error);
        res.status(500).json({ error: 'Unable to retrieve balance' });
    }
});

// New route to fetch total property value and token supply
router.get('/supply', async (req, res) => {
    try {
        const supply = await TokenSupply.findOne();
        if (!supply) {
            return res.status(404).json({ error: "Token supply not initialized" });
        }

        const totalPropertyValue = supply.totalSupply * supply.tokenPrice; // setting Property value 

        res.json({
            totalSupply: supply.totalSupply,
            remainingSupply: supply.remainingSupply,
            tokenPrice: supply.tokenPrice,
            totalPropertyValue
        });

    } catch (error) {
        console.error('Supply Fetch Error:', error);
        res.status(500).json({ error: 'Unable to retrieve token supply' });
    }
});

module.exports = router;
