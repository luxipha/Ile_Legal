const crypto = require("crypto");

const verifyPaystackWebhook = (req, res, next) => {
    // ✅ Ensure we're using the correct environment variable
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        console.error("❌ ERROR: PAYSTACK_SECRET_KEY is missing!");
        return res.status(500).json({ error: "Server misconfiguration: Missing PAYSTACK_SECRET_KEY" });
    }

    // Check if we have a signature in the headers
    if (!req.headers["x-paystack-signature"]) {
        console.error("❌ Missing Paystack signature in headers!");
        return res.status(403).json({ error: "Missing webhook signature" });
    }

    try {
        // Stringify the request body exactly as received
        const payload = JSON.stringify(req.body);
        
        // Create HMAC hash with the secret
        const hash = crypto
            .createHmac("sha512", secretKey)
            .update(payload)
            .digest("hex");

        // Compare the hash with the signature
        if (hash !== req.headers["x-paystack-signature"]) {
            console.error("❌ Invalid webhook signature!");
            console.log("Expected:", hash);
            console.log("Received:", req.headers["x-paystack-signature"]);
            return res.status(403).json({ error: "Invalid webhook signature" });
        }

        console.log("✅ Webhook verified successfully!");
        next(); // Proceed to processWebhook

    } catch (error) {
        console.error("❌ Webhook Verification Error:", error);
        res.status(500).json({ error: "Webhook verification failed" });
    }
};

module.exports = verifyPaystackWebhook;