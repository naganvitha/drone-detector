'use strict';
const express = require('express');
const compression = require('compression');
const config = require('./config');
const assets = require('./services/assetStore');
const apiRoutes = require('./routes/api');

function createApp() {
  assets.load(); // fail fast if the database files are missing or malformed
  const app = express();
  app.disable('x-powered-by');
  app.use(compression());
  app.use('/api', apiRoutes);
  app.use(express.static(config.frontendDir));
  app.use((req, res) => res.status(404).type('text/plain').send('Not found'));
  return app;
}

if (require.main === module) {
  createApp().listen(config.port, config.host, () => {
    console.log(`Live drone detector running at http://localhost:${config.port}`);
  });
}

module.exports = { createApp };
