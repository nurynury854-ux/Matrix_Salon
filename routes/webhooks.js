'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const router = express.Router();

// Map stylist identifiers to their Google Calendar IDs.
// Both Mongolian display names and Latin transliterations are accepted.
const STYLIST_CALENDAR_MAP = {
  'Алтангэрэл': 'c_7bebeb206eef286e73bba9660b9fddf9b5e48b029b380ddc9073c3817a4b936b@group.calendar.google.com',
  'altangerel':  'c_7bebeb206eef286e73bba9660b9fddf9b5e48b029b380ddc9073c3817a4b936b@group.calendar.google.com',
  'Ананд': 'c_2af068656b60e27cd9063a78b04dffbe24f1aab4543e50c2875f132dc4b12e17@group.calendar.google.com',
  'anand':  'c_2af068656b60e27cd9063a78b04dffbe24f1aab4543e50c2875f132dc4b12e17@group.calendar.google.com',
  'Бадамцэцэг': 'c_7d47cf135b4ef24b9b4e920f8e981096087b236eb4f7d92a7ad8ce7a1d407529@group.calendar.google.com',
  'badamtsetseg': 'c_7d47cf135b4ef24b9b4e920f8e981096087b236eb4f7d92a7ad8ce7a1d407529@group.calendar.google.com',
  'Батзаяа': 'c_2979833247c0886af6789e6fbf205b66477105ceac615a07597ba4f6af975f63@group.calendar.google.com',
  'batzaya':  'c_2979833247c0886af6789e6fbf205b66477105ceac615a07597ba4f6af975f63@group.calendar.google.com',
  'Мухлай': 'c_6efae8dadb0660afc266a939e8bfbd85af95bfc5ed498055ccd11175d181bbaf@group.calendar.google.com',
  'muhlai':  'c_6efae8dadb0660afc266a939e8bfbd85af95bfc5ed498055ccd11175d181bbaf@group.calendar.google.com',
  'Оюунсүрэн': 'c_46dc5625ec21ce8c17b61ed2f1c28b4328279cec168b982c49f218cd4452a4b3@group.calendar.google.com',
  'oyunsuren':  'c_46dc5625ec21ce8c17b61ed2f1c28b4328279cec168b982c49f218cd4452a4b3@group.calendar.google.com',
  'Тэргэл': 'c_1d339159e8bc7a5059cc20d52c7b2b1cda07442336f2c2a5b7880c00d6b442f9@group.calendar.google.com',
  'tergel':  'c_1d339159e8bc7a5059cc20d52c7b2b1cda07442336f2c2a5b7880c00d6b442f9@group.calendar.google.com',
  'Уянга': 'c_27de9527ce91e22bc5255af2dd51bc1db5c700d167d5aaad77062990bfe4875f@group.calendar.google.com',
  'uyanga':  'c_27de9527ce91e22bc5255af2dd51bc1db5c700d167d5aaad77062990bfe4875f@group.calendar.google.com',
};

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

/**
 * Load OAuth2 client and authorise it using the saved token.
 * @returns {google.auth.OAuth2} Authenticated OAuth2 client
 */
async function getAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

// Required fields in the webhook payload
const REQUIRED_FIELDS = [
  'paymentStatus',
  'customerName',
  'customerEmail',
  'customerPhone',
  'stylistId',
  'appointmentStartTime',
  'appointmentEndTime',
  'serviceName',
];

/**
 * POST /api/webhooks/payment-success
 *
 * Receives a payment success notification from the payment gateway (e.g. QPay)
 * and creates a Google Calendar event for the relevant stylist.
 */
router.post('/payment-success', async (req, res) => {
  const body = req.body;

  // Validate that all required fields are present
  const missingFields = REQUIRED_FIELDS.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missingFields.length > 0) {
    console.warn('Payment webhook: missing fields', missingFields);
    return res.status(400).json({
      error: 'Bad payload: missing required fields',
      missingFields,
    });
  }

  // Validate payment status
  if (body.paymentStatus !== 'PAID') {
    console.warn('Payment webhook: unexpected paymentStatus', body.paymentStatus);
    return res.status(400).json({
      error: `Bad payload: paymentStatus must be "PAID", received "${body.paymentStatus}"`,
    });
  }

  // Validate stylistId
  const calendarId = STYLIST_CALENDAR_MAP[body.stylistId];
  if (!calendarId) {
    console.warn('Payment webhook: unknown stylistId', body.stylistId);
    return res.status(400).json({
      error: `Bad payload: unknown stylistId "${body.stylistId}"`,
    });
  }

  try {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: `${body.serviceName} - ${body.customerName}`,
      description: `Customer phone: ${body.customerPhone}\nCustomer email: ${body.customerEmail}`,
      start: {
        dateTime: body.appointmentStartTime,
      },
      end: {
        dateTime: body.appointmentEndTime,
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      resource: event,
    });

    console.log('Calendar event created:', response.data.id, 'for stylist', body.stylistId);
    return res.status(200).json({
      message: 'Booking event created successfully',
      eventId: response.data.id,
    });
  } catch (err) {
    console.error('Failed to create calendar event:', err.message || err);
    return res.status(500).json({
      error: 'Failed to create calendar event',
      details: err.message || String(err),
    });
  }
});

module.exports = router;
