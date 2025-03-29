// dynamic updating of prices 
document.addEventListener("DOMContentLoaded", function () {
    // Main Page Elements
    const progressBarMain = document.getElementById("progressBarMain");
    const progressPercentageMain = document.getElementById("progressPercentageMain");
    const availableTokensMain = document.getElementById("availableTokensMain");

    // Modal Elements
    const progressBarModal = document.getElementById("progressBarModal");
    const progressPercentageModal = document.getElementById("progressPercentageModal");
    const availableTokensModal = document.getElementById("availableTokensModal");

    async function fetchSupply() {
        try {
            const response = await fetch("http://localhost:3000/supply");
            const data = await response.json();

            const totalTokens = data.totalSupply;
            let remainingTokens = data.remainingSupply;
            const totalPropertyValue = data.totalPropertyValue;

            let percentageRemaining = (remainingTokens / totalTokens) * 100;

            // ✅ Update Main Page UI
            progressBarMain.style.width = `${percentageRemaining}%`;
            progressPercentageMain.textContent = `${percentageRemaining.toFixed(2)}%`;
            availableTokensMain.textContent = `Available: ${remainingTokens} Tokens`;

            // ✅ Update Modal UI
            progressBarModal.style.width = `${percentageRemaining}%`;
            progressPercentageModal.textContent = `${percentageRemaining.toFixed(2)}%`;
            availableTokensModal.innerHTML = `Available: <strong>${remainingTokens} Tokens</strong>`;

        } catch (error) {
            console.error("Error fetching token supply:", error);
        }
    }

    // ✅ Fetch data on page load
    fetchSupply();

    // ✅ Re-fetch data when the modal is opened
    document.getElementById("tokenModal").addEventListener("show.bs.modal", fetchSupply);
});



// tooltip

     document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        .map(el => new bootstrap.Tooltip(el));

    // Token price calculator
    const tokenAmountInput = document.getElementById('tokenAmount');
    const priceCalculation = document.getElementById('priceCalculation');
    let priceNGN = 0; // Declare outside to reuse later

    tokenAmountInput.addEventListener('input', function() {
        const amount = this.value;
        if (amount) {
            const priceUSD = amount * 1;
            priceNGN = priceUSD * 1500; // Store it once
            priceCalculation.textContent = `${amount} Tokens = ₦${priceNGN.toLocaleString()}`;
        } else {
            priceCalculation.textContent = '';
            priceNGN = 0; // Reset price if input is cleared
        }
    });

    // Payment form submission
    const form = document.getElementById('tokenPurchaseForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const tokenAmount = tokenAmountInput.value;
        const email = document.getElementById('email').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Validate input
        if (!tokenAmount || !email) {
            alert('Please enter token amount and email');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
            // Call YOUR BACKEND (/buy endpoint)
            const response = await fetch('http://localhost:3000/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    tokenAmount,
                    currency: 'NGN', // or 'USD'
                    totalAmount: priceNGN // Reuse the calculated value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Payment failed');
            }

            // Redirect to Paystack checkout (URL provided by backend)
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Buy Property';
        }
    });
});

// Update progress bar & token count after purchase
document.getElementById('tokenPurchaseForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const tokenAmount = document.getElementById('tokenAmount').value;
    const email = document.getElementById('email').value;

    if (!tokenAmount || !email) {
        alert('Please enter token amount and email');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, tokenAmount, currency: 'NGN' })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Purchase failed');

        // Redirect to payment
        window.location.href = data.checkoutUrl;

        // Wait for webhook update
        setTimeout(async () => {
            const updatedResponse = await fetch('http://localhost:3000/supply');
            const updatedData = await updatedResponse.json();

            const newRemaining = updatedData.remainingSupply;
            const newPercentage = (newRemaining / updatedData.totalSupply) * 100;

            // Update UI
            progressBar.style.width = `${newPercentage}%`;
            progressText.textContent = `${newPercentage.toFixed(2)}%`;
            availableTokensText.textContent = `Available: ${newRemaining} Tokens`;
        }, 5000); // Wait for webhook to process transaction

    } catch (error) {
        console.error('Purchase Error:', error);
        alert(`Error: ${error.message}`);
    }
});

// Function to verify transaction after Paystack checkout
async function verifyTransaction(reference) {
    try {
        const response = await fetch('http://localhost:3000/buy/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference })
        });

        const data = await response.json();
        if (data.success) {
            alert('Payment successful! Tokens added.');
            window.location.reload(); // Refresh to update supply
        } else {
            alert('Payment verification failed: ' + data.message);
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert('Error verifying payment.');
    }
}

// Function to check for Paystack reference in the URL
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');

    if (reference) {
        verifyTransaction(reference);
    }
}

// Call this when the page loads
document.addEventListener("DOMContentLoaded", checkPaymentStatus);
