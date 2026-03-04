'use strict';

const express = require('express');
const { createInvoice } = require('../services/qpay');

const router = express.Router();

/**
 * POST /api/qpay/create-payment
 *
 * Creates a QPay invoice for a booking payment.
 * Expects JSON body: { merchantId, amount, description }
 * Returns: { qr_image: <Base64 string>, urls: [ { name, link }, ... ] }
 */
router.post('/create-payment', async (req, res) => {
  const { merchantId, amount, description } = req.body || {};

  if (!merchantId || !amount || !description) {
    return res.status(400).json({
      error: 'merchantId, amount, and description are required',
    });
  }

  try {
    const callbackUrl = `${process.env.BASE_URL || 'https://mydomain.com'}/api/qpay/webhook`;
    const result = await createInvoice({ merchantId, amount, description, callbackUrl });
    return res.status(200).json(result);
  } catch (err) {
    console.error('QPay create-payment error:', err.message || err);
    return res.status(502).json({
      error: 'Failed to create QPay invoice',
      details: err.message || String(err),
    });
  }
});

/**
 * POST /api/qpay/webhook
 *
 * Receives QPay's server-to-server payment callback.
 * Extracts the invoice ID and marks the corresponding order as PAID.
 */
router.post('/webhook', (req, res) => {
  const payload = req.body || {};
  const invoiceId = payload.invoice_id || payload.id;

  if (!invoiceId) {
    console.warn('QPay webhook: missing invoice_id in payload', payload);
    return res.status(400).json({ error: 'Missing invoice_id in QPay callback payload' });
  }

  console.log('QPay webhook received for invoice:', invoiceId);

  // TODO: Update your database to mark the order as PAID.
  // Example: await Order.updateOne({ qpayInvoiceId: invoiceId }, { status: 'PAID' });

  return res.status(200).json({ received: true, invoiceId });
});

module.exports = router;
