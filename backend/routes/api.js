'use strict';
const express = require('express');
const assets = require('../services/assetStore');

const router = express.Router();

// The detector assets are served as raw JSON text exactly as stored in /database/models.
// "no-cache" = the browser revalidates with the ETag, so a retrained model shows up immediately.
function sendRaw(res, raw) {
  res.set('Cache-Control', 'no-cache');
  res.type('application/json').send(raw);
}

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.get('/model', (req, res) => sendRaw(res, assets.load().model.raw));
router.get('/cascade', (req, res) => sendRaw(res, assets.load().cascade.raw));
router.get('/dataset', (req, res) => res.json(assets.info()));

module.exports = router;
