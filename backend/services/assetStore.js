'use strict';
const fs = require('fs');
const path = require('path');
const config = require('../config');

let cache = null;

function readJSON(file) {
  const full = path.join(config.modelsDir, file);
  const raw = fs.readFileSync(full, 'utf8');
  return { raw, data: JSON.parse(raw), bytes: Buffer.byteLength(raw), file };
}

function validate(model, cascade) {
  const m = model.data;
  if (!Array.isArray(m.w) || m.w.length !== config.expectedModelLength) {
    throw new Error(`drone model: expected ${config.expectedModelLength} weights, got ${Array.isArray(m.w) ? m.w.length : 'none'}`);
  }
  if (!m.w.every(Number.isFinite) || !Number.isFinite(m.b)) {
    throw new Error('drone model: weights and bias must be finite numbers');
  }
  const c = cascade.data;
  if (!Array.isArray(c.f) || !Array.isArray(c.s) || c.f.length === 0 || c.s.length === 0) {
    throw new Error('face cascade: expected non-empty "f" (features) and "s" (stages)');
  }
}

/** Load and validate both assets once; the raw JSON text is served as-is. */
function load() {
  if (cache) return cache;
  const model = readJSON(config.files.droneModel);
  const cascade = readJSON(config.files.faceCascade);
  validate(model, cascade);
  cache = { model, cascade };
  return cache;
}

function info() {
  const { model, cascade } = load();
  return {
    droneModel: {
      file: model.file,
      type: 'dense HOG + logistic regression',
      weights: model.data.w.length,
      bias: model.data.b,
      bytes: model.bytes,
    },
    faceCascade: {
      file: cascade.file,
      type: 'OpenCV frontal-face Haar cascade (Viola-Jones)',
      features: cascade.data.f.length,
      stages: cascade.data.s.length,
      bytes: cascade.bytes,
    },
  };
}

module.exports = { load, info };
