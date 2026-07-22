# Razorpay backend for Go.Varlin

The checkout modal (`static/js/checkout-modal.js`) now uses the
**order_id flow** — the same one shown in Razorpay's docs:

```js
var options = {
  "key": "YOUR_KEY_ID",
  "amount": "50000",
  "currency": "INR",
  "order_id": "order_IluGWxBm9U8zJ8", // created on the server
  "handler": function (response) { ... }
};
```

Razorpay orders can only be created with your **Key Secret**, which must
never sit in browser JavaScript. This folder is a small Express server
that creates that order and verifies the payment signature, so the flow
is fully workable end-to-end.

## Setup

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and paste your real `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
from **Razorpay Dashboard → Settings → API Keys**.

```bash
npm start
```

This starts the API on `http://localhost:4000` with two routes:

- `POST /api/razorpay/create-order`
- `POST /api/razorpay/verify`

## Wiring it to the site

1. In `static/js/checkout-modal.js`, set:
   ```js
   const RAZORPAY_KEY = 'rzp_test_xxxxxxxxxxxx'; // your Key ID (public, safe to expose)
   ```
2. If you serve the frontend from a different origin/port than the
   backend, point the two URL constants at the full backend address:
   ```js
   const RAZORPAY_CREATE_ORDER_URL = 'http://localhost:4000/api/razorpay/create-order';
   const RAZORPAY_VERIFY_URL = 'http://localhost:4000/api/razorpay/verify';
   ```
   (If you deploy them together behind the same domain, e.g. via a
   reverse proxy, the default relative paths `/api/razorpay/...` work
   as-is.)

That's it — clicking **Pay with Razorpay** will now: create a real
order on your server → open Checkout with that `order_id` → verify the
signature on your server → show the success screen.
