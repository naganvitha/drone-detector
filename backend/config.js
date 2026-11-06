'use strict';
const path = require('path');

const root = path.resolve(__dirname, '..');

module.exports = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  frontendDir: path.join(root, 'frontend'),
  modelsDir: path.join(root, 'database', 'models'),
  files: {
    droneModel: 'drone_hog_model.json',
    faceCascade: 'face_cascade.json',
  },
  // Dense-HOG window: 7x7 blocks x 32 values per block (see frontend/js/hog-scanner.js)
  expectedModelLength: 7 * 7 * 32,
};
