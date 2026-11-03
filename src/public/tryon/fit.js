/**
 * Pure geometric and lighting math for pose-based virtual try-on.
 * No DOM dependencies; safe for headless unit tests.
 */

export const KEYPOINT_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle'
];

/**
 * Maps normalized coordinates from a square-padded 192x192 box back to original photo pixel space.
 */
export function mapNormalizedToImage(normX, normY, imageWidth, imageHeight) {
  const maxDim = Math.max(imageWidth, imageHeight);
  const padX = (maxDim - imageWidth) / 2;
  const padY = (maxDim - imageHeight) / 2;
  return {
    x: normX * maxDim - padX,
    y: normY * maxDim - padY
  };
}

/**
 * Parses MoveNet SinglePose Lightning v4 flattened output [1, 1, 17, 3].
 * Each keypoint has (y, x, score) normalised to the 192x192 padded input.
 * Returns array of 17 keypoint objects with names, mapped photo pixel coords, and scores.
 */
export function parseMoveNetOutput(flatArray, origW, origH) {
  if (!flatArray || flatArray.length < 51) return [];

  const keypoints = [];
  let totalScore = 0;

  for (let i = 0; i < 17; i++) {
    const base = i * 3;
    const normY = flatArray[base];
    const normX = flatArray[base + 1];
    const score = flatArray[base + 2];

    const mapped = mapNormalizedToImage(normX, normY, origW, origH);
    const roundedScore = Math.round(score * 1000) / 1000;

    keypoints.push({
      name: KEYPOINT_NAMES[i],
      x: mapped.x,
      y: mapped.y,
      score: roundedScore
    });

    totalScore += score;
  }

  keypoints.keypoints = keypoints;
  keypoints.score = Math.round((totalScore / 17) * 1000) / 1000;

  return keypoints;
}

/**
 * Safe keypoint lookup by name or index from array or keyed object.
 */
export function getKeypoint(keypoints, identifier) {
  if (!keypoints) return null;

  // Direct keyed object lookup
  if (!Array.isArray(keypoints)) {
    if (keypoints[identifier]) return keypoints[identifier];
    // Try aliases
    const aliasMap = {
      left_shoulder: ['l_shoulder', 'shoulderL', 'leftShoulder'],
      right_shoulder: ['r_shoulder', 'shoulderR', 'rightShoulder'],
      left_hip: ['l_hip', 'hipL', 'leftHip'],
      right_hip: ['r_hip', 'hipR', 'rightHip'],
      nose: ['head']
    };
    if (aliasMap[identifier]) {
      for (const alias of aliasMap[identifier]) {
        if (keypoints[alias]) return keypoints[alias];
      }
    }
    return null;
  }

  // If index number
  if (typeof identifier === 'number') {
    return keypoints[identifier] || null;
  }

  // Lookup in array by name
  const nameToIdx = {
    nose: 0,
    left_shoulder: 5,
    l_shoulder: 5,
    right_shoulder: 6,
    r_shoulder: 6,
    left_hip: 11,
    l_hip: 11,
    right_hip: 12,
    r_hip: 12
  };

  const found = keypoints.find((kp) => {
    if (!kp) return false;
    return kp.name === identifier ||
           kp.name === identifier.replace('left_', 'l_') ||
           kp.name === identifier.replace('right_', 'r_') ||
           (identifier === 'left_shoulder' && kp.name === 'l_shoulder') ||
           (identifier === 'right_shoulder' && kp.name === 'r_shoulder');
  });

  if (found) return found;

  const idx = nameToIdx[identifier];
  if (idx !== undefined && keypoints[idx]) {
    return keypoints[idx];
  }

  return null;
}

/**
 * Mean confidence score across shoulders and hips.
 */
export function poseConfidence(keypoints) {
  const lShoulder = getKeypoint(keypoints, 'left_shoulder');
  const rShoulder = getKeypoint(keypoints, 'right_shoulder');
  const lHip = getKeypoint(keypoints, 'left_hip');
  const rHip = getKeypoint(keypoints, 'right_hip');

  const scores = [
    lShoulder?.score ?? 0,
    rShoulder?.score ?? 0,
    lHip?.score ?? 0,
    rHip?.score ?? 0
  ];

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * Gate check for usable fitting pose:
 * - poseConfidence >= 0.3
 * - shoulders >= 0.3 each
 * - shoulder distance >= 8% of image width
 */
export function isUsablePose(keypoints, imageWidth) {
  if (!keypoints || !imageWidth || imageWidth <= 0) return false;

  const confidence = poseConfidence(keypoints);
  if (confidence < 0.3) return false;

  const lShoulder = getKeypoint(keypoints, 'left_shoulder');
  const rShoulder = getKeypoint(keypoints, 'right_shoulder');

  if (!lShoulder || !rShoulder) return false;
  if ((lShoulder.score ?? 0) < 0.3 || (rShoulder.score ?? 0) < 0.3) return false;

  const shoulderDist = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
  if (shoulderDist < 0.08 * imageWidth) return false;

  return true;
}

/**
 * Computes placement { x, y, scale, rotation } in photo pixel space.
 * - rotation = shoulder-line angle
 * - scale = shoulder distance vs garment shoulder width, optionally blended with torso length, clamped
 * - position = garment shoulder-midpoint anchor on body shoulder midpoint, nudged up toward neck
 */
export function computePlacement(keypoints, anchors, garmentSize = { width: 600, height: 750 }) {
  const gw = garmentSize.width || 600;
  const gh = garmentSize.height || 750;

  // Garment anchors
  const gShoulderL = anchors?.shoulderL || [200, 270];
  const gShoulderR = anchors?.shoulderR || [400, 270];
  const gMid = {
    x: (gShoulderL[0] + gShoulderR[0]) / 2,
    y: (gShoulderL[1] + gShoulderR[1]) / 2
  };
  const gShoulderDist = Math.max(10, Math.hypot(gShoulderR[0] - gShoulderL[0], gShoulderR[1] - gShoulderL[1]));

  // Body shoulders
  const lShoulder = getKeypoint(keypoints, 'left_shoulder') || { x: 200, y: 300, score: 0.5 };
  const rShoulder = getKeypoint(keypoints, 'right_shoulder') || { x: 400, y: 300, score: 0.5 };

  // Viewer's left vs viewer's right shoulder:
  // In photo pixel space: x is smaller on the viewer's left, larger on viewer's right.
  const bViewerLeft = (lShoulder.x < rShoulder.x) ? lShoulder : rShoulder;
  const bViewerRight = (lShoulder.x < rShoulder.x) ? rShoulder : lShoulder;

  // Body shoulder distance and midpoint
  const bShoulderDist = Math.max(10, Math.hypot(bViewerRight.x - bViewerLeft.x, bViewerRight.y - bViewerLeft.y));
  const bMid = {
    x: (bViewerLeft.x + bViewerRight.x) / 2,
    y: (bViewerLeft.y + bViewerRight.y) / 2
  };

  // Shoulder line rotation (tilt angle in radians)
  const rotation = Math.atan2(bViewerRight.y - bViewerLeft.y, bViewerRight.x - bViewerLeft.x);

  // Scale from shoulder width
  let scale = bShoulderDist / gShoulderDist;

  // Allowance for flowing garments (agbada, kaftan)
  if (anchors?.fit === 'flowing') {
    scale *= 1.08;
  }

  // Torso length blending if hips are confident
  const lHip = getKeypoint(keypoints, 'left_hip');
  const rHip = getKeypoint(keypoints, 'right_hip');
  if (lHip && rHip && (lHip.score ?? 0) >= 0.3 && (rHip.score ?? 0) >= 0.3 && anchors?.waistY) {
    const bHipMid = {
      x: (lHip.x + rHip.x) / 2,
      y: (lHip.y + rHip.y) / 2
    };
    const bTorso = Math.hypot(bHipMid.x - bMid.x, bHipMid.y - bMid.y);
    const gTorso = Math.abs((anchors.waistY || 430) - gMid.y);
    if (gTorso > 20) {
      const torsoScale = bTorso / gTorso;
      // Blend 75% shoulder width, 25% torso length
      scale = scale * 0.75 + torsoScale * 0.25;
    }
  }

  // Clamp scale to safe bounds
  scale = Math.max(0.15, Math.min(3.5, scale));

  // Nudge position up toward neck/nose
  const nose = getKeypoint(keypoints, 'nose');
  let nudgeX = 0;
  let nudgeY = 0;

  if (nose && (nose.score ?? 0) >= 0.3) {
    const dx = nose.x - bMid.x;
    const dy = nose.y - bMid.y;
    const noseDist = Math.hypot(dx, dy);
    if (noseDist > 0) {
      const nudgeAmount = Math.min(noseDist * 0.22, bShoulderDist * 0.12);
      nudgeX = (dx / noseDist) * nudgeAmount;
      nudgeY = (dy / noseDist) * nudgeAmount;
    }
  } else {
    // Upward perpendicular to shoulder line
    nudgeX = -Math.sin(rotation) * (bShoulderDist * 0.08);
    nudgeY = -Math.cos(rotation) * (bShoulderDist * 0.08);
  }

  const targetMidX = bMid.x + nudgeX;
  const targetMidY = bMid.y + nudgeY;

  // Garment center coordinates when drawn centered at (x, y) with rotation and scale
  const dxLocal = gMid.x - gw / 2;
  const dyLocal = gMid.y - gh / 2;

  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  const dxCanvas = scale * (dxLocal * cosR - dyLocal * sinR);
  const dyCanvas = scale * (dxLocal * sinR + dyLocal * cosR);

  const x = targetMidX - dxCanvas;
  const y = targetMidY - dyCanvas;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    scale: Math.round(scale * 1000) / 1000,
    rotation: Math.round(rotation * 10000) / 10000
  };
}

/**
 * Estimates dominant light direction ('left' | 'right') and brightness factor.
 * Pure logic from luminance stats.
 */
export function estimateLight(stats = {}) {
  const left = stats.leftLuminance ?? 128;
  const right = stats.rightLuminance ?? 128;
  const mean = stats.meanLuminance ?? ((left + right) / 2);

  const direction = left >= right ? 'left' : 'right';
  const brightness = Math.max(0.75, Math.min(1.25, mean / 128));
  const diff = Math.abs(left - right);

  return {
    direction,
    brightness: Math.round(brightness * 100) / 100,
    leftLuminance: left,
    rightLuminance: right,
    meanLuminance: mean,
    contrastRatio: diff / (mean || 1)
  };
}
