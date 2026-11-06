/* Bootstrap: fetch the trained assets from the backend (which reads them from /database),
   expose them as the globals the detector code expects (MODEL, CASC), then load the app
   scripts one after another in the original order. Classic scripts share one global scope,
   exactly like the original single-file app. */
(function () {
  'use strict';
  var SCRIPTS = [
    'js/hog-scanner.js',   /* dense-HOG drone scanner (needs MODEL at runtime) */
    'js/face-detector.js', /* Viola-Jones face detector (needs CASC at runtime) */
    'js/state.js',         /* DOM handles, shared state, per-browser model adaptation */
    'js/sources.js',       /* demo scene, still image, camera drawing */
    'js/detector.js',      /* face scan, whole-frame drone scan, moving-blob detector */
    'js/reliability.js',   /* temperature-scaled calibrated confidence + verdict text */
    'js/ui.js',            /* paint(), sparkline, main loop */
    'js/controls.js',      /* mode switching, image upload, camera */
    'js/teach.js',         /* candidate features, kNN gates, Teach buttons */
    'js/main.js'           /* start in demo mode */
  ];

  function showError(msg) {
    var el = document.getElementById('err');
    if (el) el.textContent = msg;
    var st = document.getElementById('status');
    if (st) st.textContent = 'Could not start';
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' returned HTTP ' + r.status);
      return r.json();
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.body.appendChild(s);
    });
  }

  Promise.all([getJSON('/api/model'), getJSON('/api/cascade')])
    .then(function (r) {
      window.MODEL = r[0];
      window.CASC = r[1];
      return SCRIPTS.reduce(function (p, src) {
        return p.then(function () { return loadScript(src); });
      }, Promise.resolve());
    })
    .catch(function (e) {
      showError('Startup failed: ' + (e && e.message ? e.message : e) +
        '. Start the backend with "npm start" and open http://localhost:3000 (do not open index.html directly).');
    });
})();
