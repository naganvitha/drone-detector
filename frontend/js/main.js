setMode('demo');requestAnimationFrame(loop);
/* Note: scanner weights come from train_drone.py (MODEL above); to use another model, replace MODEL and keep the 48 px dense-HOG scanner. Older note: replace detect() so it returns {scene,det:{conf,area,box}} from your network, then replace PEN with values fitted on your data. */
