/* ============================================================
   GO.VARLIN — Razorpay backend (example)
   Provides the two endpoints the checkout modal calls:
     POST /api/razorpay/create-order   -> creates a Razorpay Order
     POST /api/razorpay/verify         -> verifies payment signature

   Run:
     cd server
     npm install
     cp .env.example .env      # then fill in your real keys
     npm start                 # starts on http://localhost:4000

   Then either:
     - proxy /api/* from your static site to this server, or
     - change RAZORPAY_CREATE_ORDER_URL / RAZORPAY_VERIFY_URL in
       static/js/checkout-modal.js to the full URL of this server,
       e.g. "http://localhost:4000/api/razorpay/create-order"
   ============================================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1) Create an order. The frontend sends the amount (in paise) it wants to charge;
//    in production, re-derive that amount from the course slug on the server
//    instead of trusting the client, so prices can't be tampered with.
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'A valid amount (in paise) is required.' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    });

    res.json(order); // { id, amount, currency, ... }
  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ error: 'Could not create order.' });
  }
});

// 2) Verify the signature Checkout returns after a successful payment.
app.post('/api/razorpay/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const verified = expectedSignature === razorpay_signature;

    if (verified) {
      // TODO: mark the enrollment/order as paid in your database here.
    }

    res.json({ verified });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ verified: false, error: 'Verification failed.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Razorpay backend running on http://localhost:${PORT}`));
