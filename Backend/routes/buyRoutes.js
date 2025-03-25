const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const { initiatePayment } = require('../services/paystack');

// In buyRoutes.js
// router.post('/', async (req, res) => {
//     const { email, tokenAmount, currency } = req.body;
    
//     try {
//         const response = await axios.post(
//             'https://api.paystack.co/transaction/initialize',
//             {
//                 email,
//                 amount: tokenAmount * 5 * 100, // Convert to Naira
//                 currency,
//                 metadata: { tokenAmount }
//             },
//             { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
//         );

//         res.json({
//             success: true,
//             checkoutUrl: response.data.data.authorization_url
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             success: false, 
//             message: error.response?.data?.message || 'Payment failed' 
//         });
//     }
// });
router.post('/', async (req, res) => {
    console.log("Paystack Key:", process.env.PAYSTACK_SECRET_KEY);  // Debugging line
    
    const { email, tokenAmount, currency } = req.body;

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: tokenAmount * 5 * 100, // Convert to kobo
                currency,
                metadata: { tokenAmount }
            },
            { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
        );

        res.json({
            success: true,
            checkoutUrl: response.data.data.authorization_url
        });
    } catch (error) {
        console.error("Paystack Error:", error.response?.data);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || 'Payment failed' 
        });
    }
});


module.exports = router;
