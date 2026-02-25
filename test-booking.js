'use strict';

/**
 * Standalone verification script for the payment webhook.
 *
 * Simulates a successful QPay deposit notification for stylist 'anand'
 * on March 5th, 2026 and logs the server response.
 *
 * Usage:
 *   1. Start the server:  node server.js
 *   2. Run this script:   node test-booking.js
 */

const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/payment-success';

const testPayload = {
  paymentStatus: 'PAID',
  stylistId: 'anand',
  serviceName: 'Haircut',
  customerName: 'Test Customer',
  customerPhone: '+97699112233',
  customerEmail: 'testcustomer@example.com',
  appointmentStartTime: '2026-03-05T10:00:00+08:00',
  appointmentEndTime: '2026-03-05T11:00:00+08:00',
};

axios
  .post(WEBHOOK_URL, testPayload)
  .then((response) => {
    console.log('✅ Booking triggered successfully!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  })
  .catch((err) => {
    if (err.response) {
      console.error('❌ Server returned an error:');
      console.error('Status:', err.response.status);
      console.error('Response:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('❌ Request failed:', err.message);
    }
    process.exitCode = 1;
  });
