'use strict';

const express = require('express');
const webhookRouter = require('./routes/webhooks');

const app = express();

app.use(express.json());

app.use('/api/webhooks', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Matrix Salon server running on port ${PORT}`);
});

module.exports = app;
