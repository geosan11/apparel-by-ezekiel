/**
 * MoveNet SinglePose Lightning v4 pose detection lazy loader.
 * Client-side only. 100% on-device. Zero upload.
 */

import { MODEL_BYTES, MODEL_URL } from './modelInfo.js';
import { KEYPOINT_NAMES, mapNormalizedToImage, parseMoveNetOutput } from './fit.js';

let loadedModel = null;
let modelPromise = null;
let tfInstance = null;

/**
 * Lazy loads MoveNet Lightning v4 with progress reporting, backend fallback (webgl -> cpu),
 * memoisation, and 20s timeout.
 */
export async function loadPoseModel(options = {}) {
  if (loadedModel) {
    if (typeof options.onProgress === 'function') {
      options.onProgress({ loadedBytes: MODEL_BYTES, totalBytes: MODEL_BYTES });
    }
    return loadedModel;
  }

  if (modelPromise) {
    return modelPromise;
  }

  modelPromise = (async () => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Pose model download/init timed out (20s)'));
      }, 20000);
    });

    const loadTask = (async () => {
      // Dynamic imports of TF.js packages (isolated in lazy chunk)
      const [tf, { loadGraphModel }] = await Promise.all([
        import('@tensorflow/tfjs-core'),
        import('@tensorflow/tfjs-converter'),
        import('@tensorflow/tfjs-backend-webgl').catch(() => null),
        import('@tensorflow/tfjs-backend-cpu').catch(() => null)
      ]);

      tfInstance = tf;

      // Backend negotiation: WebGL -> CPU
      let backendReady = false;
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        backendReady = true;
      } catch (err) {
        console.warn('[tryon] WebGL backend unavailable, trying CPU:', err);
      }

      if (!backendReady) {
        try {
          await tf.setBackend('cpu');
          await tf.ready();
          backendReady = true;
        } catch (cpuErr) {
          console.warn('[tryon] Both WebGL and CPU backends failed:', cpuErr);
          throw new Error('Both WebGL and CPU TensorFlow backends failed to initialise.');
        }
      }

      // Load graph model with weight streaming progress
      const model = await loadGraphModel(MODEL_URL, {
        onProgress: (fraction) => {
          if (typeof options.onProgress === 'function') {
            const loadedBytes = Math.min(MODEL_BYTES, Math.round((fraction || 0) * MODEL_BYTES));
            options.onProgress({ loadedBytes, totalBytes: MODEL_BYTES });
          }
        }
      });

      loadedModel = model;

      if (typeof options.onProgress === 'function') {
        options.onProgress({ loadedBytes: MODEL_BYTES, totalBytes: MODEL_BYTES });
      }

      return model;
    })();

    try {
      const result = await Promise.race([loadTask, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      modelPromise = null; // Allow retry on failure
      console.warn('[tryon] Pose model load error:', err);
      throw err;
    }
  })();

  return modelPromise;
}

/**
 * Runs SinglePose Lightning v4 on an ImageBitmap, HTMLCanvasElement, or HTMLImageElement.
 * Input: [1, 192, 192, 3] int32 tensor (padded to square, resized to 192).
 * Output: [1, 1, 17, 3] float tensor (y, x, score) mapped back to original coordinates.
 * Tensors disposed via tf.tidy.
 */
export async function detectPose(imageBitmapOrCanvas) {
  if (!loadedModel) {
    await loadPoseModel();
  }

  const tf = tfInstance;
  if (!tf || !loadedModel) {
    throw new Error('Pose model not loaded.');
  }

  const origW = imageBitmapOrCanvas.width || imageBitmapOrCanvas.naturalWidth || 600;
  const origH = imageBitmapOrCanvas.height || imageBitmapOrCanvas.naturalHeight || 800;

  // Prepare 192x192 square canvas with letterbox padding
  const offscreen = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(192, 192)
    : document.createElement('canvas');
  offscreen.width = 192;
  offscreen.height = 192;

  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 192, 192);

  const maxDim = Math.max(origW, origH);
  const scale = 192 / maxDim;
  const scaledW = Math.round(origW * scale);
  const scaledH = Math.round(origH * scale);
  const offsetX = Math.round((192 - scaledW) / 2);
  const offsetY = Math.round((192 - scaledH) / 2);

  ctx.drawImage(imageBitmapOrCanvas, offsetX, offsetY, scaledW, scaledH);

  // Run prediction with automatic tensor disposal
  let rawOutput;
  try {
    rawOutput = tf.tidy(() => {
      // tf.browser.fromPixels produces int32 tensor with shape [192, 192, 3]
      const pixels = tf.browser.fromPixels(offscreen);
      const input = tf.cast(tf.expandDims(pixels, 0), 'int32'); // [1, 192, 192, 3] int32
      const output = loadedModel.predict(input); // [1, 1, 17, 3]
      const tensor = Array.isArray(output) ? output[0] : (output?.dataSync ? output : Object.values(output)[0]);
      return Array.from(tensor.dataSync());
    });
  } catch (err) {
    console.warn('[tryon] Pose detection inference failed:', err);
    throw err;
  }

  // Parse 17 keypoints back through padding to photo pixel coordinates
  const keypoints = parseMoveNetOutput(rawOutput, origW, origH);
  const totalScore = keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0);
  const avgScore = keypoints.length ? Math.round((totalScore / keypoints.length) * 1000) / 1000 : 0;

  return {
    keypoints,
    score: avgScore
  };
}
