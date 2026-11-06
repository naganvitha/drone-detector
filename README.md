# Live drone detector

Same app as the original single HTML file, split into a frontend, a small Node backend and a database folder.
Detection runs in the browser (camera frames never leave your device); the backend serves the page and the trained assets.

## Run

    npm install
    npm start          # http://localhost:3000   (PORT=4000 npm start to change the port)
    npm test           # backend checks

Open it through the server (`http://localhost:3000`), not by double-clicking `index.html`.
Camera access needs `localhost` or HTTPS.

## Structure

    drone-detector/
    ├── package.json
    ├── backend/
    │   ├── server.js               Express app: /api routes + static frontend
    │   ├── config.js               port, folders, expected model size
    │   ├── routes/api.js           GET /api/health | model | cascade | dataset
    │   ├── services/assetStore.js  loads + validates the JSON assets at startup
    │   └── tests/api.test.js
    ├── database/
    │   └── models/
    │       ├── drone_hog_model.json   1568 logistic-regression weights + bias (dense HOG, 48 px window)
    │       └── face_cascade.json      OpenCV frontal-face Haar cascade (2913 features, 25 stages)
    └── frontend/
        ├── index.html              markup only
        ├── css/styles.css
        └── js/                     loaded in this order by bootstrap.js
            ├── bootstrap.js        fetches /api/model + /api/cascade, then loads the files below
            ├── hog-scanner.js      dense-HOG sliding-window drone scanner (multi-scale, NMS)
            ├── face-detector.js    Viola-Jones face detector (blocks windows that sit on a face)
            ├── state.js            DOM handles, shared state, per-browser model adaptation
            ├── sources.js          demo scene, still image, camera drawing
            ├── detector.js         face scan, whole-frame scan + 3-scan persistence, moving-blob path
            ├── reliability.js      temperature-scaled calibrated confidence + verdict messages
            ├── ui.js               paint(), confidence sparkline, main loop
            ├── controls.js         mode switching, image upload, camera, flip
            ├── teach.js            candidate features, kNN gates, "Teach the detector" buttons
            └── main.js             starts in demo mode

## Data flow

1. Browser opens `/` and `bootstrap.js` fetches `/api/model` and `/api/cascade` (served from `database/models`).
2. Camera, image or demo frame is drawn to a canvas.
3. Every frame: moving-blob detector; about 4x/s: face detector; every ~0.2 s+: whole-frame HOG scan.
4. A hit must hold the same place for 3 scans; the raw score is then calibrated by `reliability.js`.
5. "Teach" examples and per-browser model tweaks are stored in the browser's `localStorage`
   (`droneSamples`, `droneDelta`), same as before. There is no server-side user database.

## Notes

- The 483-photo training set and `train_drone.py` were not part of the HTML file, so they are not included.
  To use a retrained model, replace `database/models/drone_hog_model.json` (same shape: `{"w":[1568 numbers],"b":number}`)
  and restart.
