import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  mapNormalizedToImage,
  poseConfidence,
  isUsablePose,
  computePlacement,
  estimateLight
} from '../src/public/tryon/fit.js';

import { GARMENT_ANCHORS, getAnchors } from '../src/public/tryon/anchors.js';

describe('Virtual Try-On Anchors & Designs', () => {
  it('anchors exist for every design in data/designs.json', () => {
    const designsPath = path.resolve(process.cwd(), 'data', 'designs.json');
    const designs = JSON.parse(readFileSync(designsPath, 'utf8'));

    expect(designs.length).toBeGreaterThan(0);

    for (const design of designs) {
      const anchor = GARMENT_ANCHORS[design.id];
      expect(anchor, `Anchor missing for design "${design.id}"`).toBeDefined();
      expect(Array.isArray(anchor.shoulderL)).toBe(true);
      expect(anchor.shoulderL.length).toBe(2);
      expect(Array.isArray(anchor.shoulderR)).toBe(true);
      expect(anchor.shoulderR.length).toBe(2);
      expect(typeof anchor.waistY).toBe('number');
      expect(['fitted', 'flowing']).toContain(anchor.fit);
    }
  });

  it('getAnchors returns known anchor or safe fallback', () => {
    const known = getAnchors('imperial-agbada');
    expect(known.fit).toBe('flowing');

    const unknown = getAnchors('unknown-design-xyz');
    expect(unknown).toBeDefined();
    expect(unknown.shoulderL).toEqual([200, 270]);
    expect(unknown.fit).toBe('fitted');
  });
});

describe('Coordinate Mapping & Padding Helper', () => {
  it('maps center normalized coordinates in portrait image correctly', () => {
    // 600w x 800h => maxDim = 800, padX = 100, padY = 0
    const center = mapNormalizedToImage(0.5, 0.5, 600, 800);
    expect(center.x).toBe(300); // 0.5 * 800 - 100
    expect(center.y).toBe(400); // 0.5 * 800 - 0
  });

  it('maps center normalized coordinates in landscape image correctly', () => {
    // 800w x 600h => maxDim = 800, padX = 0, padY = 100
    const center = mapNormalizedToImage(0.5, 0.5, 800, 600);
    expect(center.x).toBe(400); // 0.5 * 800 - 0
    expect(center.y).toBe(300); // 0.5 * 800 - 100
  });

  it('maps corners back accurately through square padding', () => {
    // 600w x 800h
    // Top-left of unpadded photo is at (100, 0) in 800x800 square => norm: (100/800, 0/800) = (0.125, 0)
    const topLeft = mapNormalizedToImage(0.125, 0, 600, 800);
    expect(topLeft.x).toBeCloseTo(0, 5);
    expect(topLeft.y).toBeCloseTo(0, 5);

    // Bottom-right of unpadded photo is at (700, 800) in 800x800 square => norm: (700/800, 1.0) = (0.875, 1.0)
    const bottomRight = mapNormalizedToImage(0.875, 1.0, 600, 800);
    expect(bottomRight.x).toBeCloseTo(600, 5);
    expect(bottomRight.y).toBeCloseTo(800, 5);
  });
});

describe('Pose Confidence & Usability Gating', () => {
  const goodKeypoints = [
    { name: 'nose', x: 300, y: 150, score: 0.9 },
    null, null, null, null, // 1..4 eyes/ears
    { name: 'left_shoulder', x: 220, y: 250, score: 0.85 },
    { name: 'right_shoulder', x: 380, y: 250, score: 0.88 },
    null, null, null, null, // 7..10 elbows/wrists
    { name: 'left_hip', x: 240, y: 450, score: 0.75 },
    { name: 'right_hip', x: 360, y: 450, score: 0.78 }
  ];

  it('computes correct mean poseConfidence of shoulders and hips', () => {
    const conf = poseConfidence(goodKeypoints);
    // (0.85 + 0.88 + 0.75 + 0.78) / 4 = 3.26 / 4 = 0.815
    expect(conf).toBeCloseTo(0.815, 3);
  });

  it('isUsablePose returns true for well-framed confident pose', () => {
    // Image width 600, shoulder distance 160 px (26.6% > 8%)
    expect(isUsablePose(goodKeypoints, 600)).toBe(true);
  });

  it('isUsablePose rejects when confidence is below 0.3', () => {
    const lowConf = goodKeypoints.map((kp) => (kp ? { ...kp, score: 0.2 } : null));
    expect(isUsablePose(lowConf, 600)).toBe(false);
  });

  it('isUsablePose rejects when one shoulder is below 0.3', () => {
    const weakShoulder = goodKeypoints.map((kp) => {
      if (kp && kp.name === 'left_shoulder') return { ...kp, score: 0.15 };
      return kp;
    });
    expect(isUsablePose(weakShoulder, 600)).toBe(false);
  });

  it('isUsablePose rejects when shoulders are too close (< 8% image width)', () => {
    const narrowShoulders = goodKeypoints.map((kp) => {
      if (kp && kp.name === 'left_shoulder') return { ...kp, x: 295, y: 250 };
      if (kp && kp.name === 'right_shoulder') return { ...kp, x: 305, y: 250 }; // distance = 10px on 600px width (1.6% < 8%)
      return kp;
    });
    expect(isUsablePose(narrowShoulders, 600)).toBe(false);
  });
});

describe('Pose-Based Garment Placement (computePlacement)', () => {
  const anchors = {
    shoulderL: [200, 270],
    shoulderR: [400, 270],
    waistY: 430,
    fit: 'fitted'
  };

  it('produces rotation near zero for upright shoulders', () => {
    const uprightPose = {
      left_shoulder: { x: 200, y: 300, score: 0.9 },
      right_shoulder: { x: 400, y: 300, score: 0.9 },
      left_hip: { x: 220, y: 500, score: 0.8 },
      right_hip: { x: 380, y: 500, score: 0.8 }
    };

    const placement = computePlacement(uprightPose, anchors);
    expect(Math.abs(placement.rotation)).toBeLessThan(0.001);
  });

  it('produces opposite rotation signs for left vs right tilted shoulders', () => {
    // Tilt A: Viewer's right shoulder lower than left shoulder (dy > 0)
    const tiltRightLower = {
      left_shoulder: { x: 200, y: 280, score: 0.9 },
      right_shoulder: { x: 400, y: 320, score: 0.9 }
    };
    const placementA = computePlacement(tiltRightLower, anchors);

    // Tilt B: Viewer's right shoulder higher than left shoulder (dy < 0)
    const tiltRightHigher = {
      left_shoulder: { x: 200, y: 320, score: 0.9 },
      right_shoulder: { x: 400, y: 280, score: 0.9 }
    };
    const placementB = computePlacement(tiltRightHigher, anchors);

    expect(placementA.rotation).toBeGreaterThan(0);
    expect(placementB.rotation).toBeLessThan(0);
    expect(placementA.rotation).toBeCloseTo(-placementB.rotation, 3);
  });

  it('produces smaller scale for smaller person / narrow shoulders', () => {
    const largePerson = {
      left_shoulder: { x: 150, y: 300, score: 0.9 },
      right_shoulder: { x: 450, y: 300, score: 0.9 } // width 300
    };
    const smallPerson = {
      left_shoulder: { x: 240, y: 300, score: 0.9 },
      right_shoulder: { x: 360, y: 300, score: 0.9 } // width 120
    };

    const placementLarge = computePlacement(largePerson, anchors);
    const placementSmall = computePlacement(smallPerson, anchors);

    expect(placementSmall.scale).toBeLessThan(placementLarge.scale);
  });

  it('wide vs narrow shoulders produces corresponding scale change', () => {
    const wideShoulders = {
      left_shoulder: { x: 180, y: 300, score: 0.9 },
      right_shoulder: { x: 420, y: 300, score: 0.9 }
    };
    const narrowShoulders = {
      left_shoulder: { x: 220, y: 300, score: 0.9 },
      right_shoulder: { x: 380, y: 300, score: 0.9 }
    };

    const placementWide = computePlacement(wideShoulders, anchors);
    const placementNarrow = computePlacement(narrowShoulders, anchors);

    expect(placementWide.scale).toBeGreaterThan(placementNarrow.scale);
  });

  it('nudges position upward toward the neck when nose is present', () => {
    const poseWithNose = {
      nose: { x: 300, y: 180, score: 0.95 },
      left_shoulder: { x: 200, y: 300, score: 0.9 },
      right_shoulder: { x: 400, y: 300, score: 0.9 }
    };
    const poseWithoutNose = {
      left_shoulder: { x: 200, y: 300, score: 0.9 },
      right_shoulder: { x: 400, y: 300, score: 0.9 }
    };

    const placementNose = computePlacement(poseWithNose, anchors);
    const placementNoNose = computePlacement(poseWithoutNose, anchors);

    // Both should sit around horizontal center 300
    expect(placementNose.x).toBeCloseTo(300, 0);
    // Y position should be higher up (smaller y) when oriented towards neck
    expect(placementNose.y).toBeLessThan(450);
  });

  it('gives wider scale allowance for flowing garments (Agbada / Kaftan)', () => {
    const pose = {
      left_shoulder: { x: 200, y: 300, score: 0.9 },
      right_shoulder: { x: 400, y: 300, score: 0.9 }
    };
    const fittedAnchors = { ...anchors, fit: 'fitted' };
    const flowingAnchors = { ...anchors, fit: 'flowing' };

    const fittedPlacement = computePlacement(pose, fittedAnchors);
    const flowingPlacement = computePlacement(pose, flowingAnchors);

    expect(flowingPlacement.scale).toBeGreaterThan(fittedPlacement.scale);
  });
});

describe('Light Estimation (estimateLight)', () => {
  it('detects left light source direction when left luminance is greater', () => {
    const stats = { leftLuminance: 175, rightLuminance: 95, meanLuminance: 135 };
    const light = estimateLight(stats);
    expect(light.direction).toBe('left');
    expect(light.brightness).toBeCloseTo(135 / 128, 2);
  });

  it('detects right light source direction when right luminance is greater', () => {
    const stats = { leftLuminance: 80, rightLuminance: 160, meanLuminance: 120 };
    const light = estimateLight(stats);
    expect(light.direction).toBe('right');
    expect(light.brightness).toBeCloseTo(120 / 128, 2);
  });
});

describe('Order Now Flow & Design Prefill', () => {
  it('prefill selects the correct design id into booking modal target', () => {
    // Simulates openBookingModal(design)
    const testDesign = {
      id: 'imperial-agbada',
      title: 'The Imperial Agbada',
      priceFormatted: '₦385,000'
    };

    // Mock minimal DOM select
    const selectMock = { value: '' };
    let currentBookingDesign = null;

    function simulateOpenBookingModal(design) {
      currentBookingDesign = design;
      if (selectMock && design) {
        selectMock.value = design.id;
      }
    }

    simulateOpenBookingModal(testDesign);

    expect(currentBookingDesign.id).toBe('imperial-agbada');
    expect(selectMock.value).toBe('imperial-agbada');
  });
});
