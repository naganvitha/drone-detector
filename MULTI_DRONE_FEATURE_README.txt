MULTIPLE DRONE DETECTION PATCH

Apply these files to your existing inner drone-detector project folder, keeping the folder structure:
- frontend/js/detector.js
- frontend/js/ui.js
- frontend/js/controls.js
- frontend/js/teach.js
- frontend/index.html
- frontend/css/styles.css

The scanner already generated up to six non-maximum-suppressed candidate windows. This patch keeps multiple candidates, associates them with short-lived tracks using IoU, requires three consecutive scan matches, and displays each confirmed detection with its confidence.

Important limitations:
- The current scanner is still a traditional HOG + Logistic Regression classifier.
- It can show up to six candidate detections, but this does not guarantee six real drones.
- The temporary track numbers are only for keeping separate boxes stable during the current view. They are not permanent identities and do not perform re-identification after disappearance.
- Test with images containing multiple drones and inspect false positives before presenting performance claims.

After copying the files, from the inner project folder run:
  npm start
Then open http://localhost:3000 and choose Test with image or Use camera.
Run backend tests with:
  npm test
