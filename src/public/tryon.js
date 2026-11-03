/**
 * Virtual Try-On Canvas (Beta)
 * 100% on-device processing. No images uploaded.
 * Supports:
 * - Photo from file or live camera with EXIF orientation & downscaling to <= 1024px
 * - Automatic pose-based placement via MoveNet Lightning v4
 * - Realistic 2D compositing with contact drop shadow and ambient light matching
 * - Manual fine-tune via drag, sliders, wheel zoom, and multi-touch pinch/rotate
 * - Canvas export / download as high-res PNG with luxury atelier watermark
 */

import { renderCompositedGarment, computeLuminanceStats } from './tryon/shade.js';
import { estimateLight } from './tryon/fit.js';

export class VirtualTryOn {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.userImage = null;
    this.garmentImage = null;
    this.lightInfo = null;

    // Garment transform state (in canvas coordinate space)
    this.transform = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0 // radians
    };

    // Interaction tracking
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.touchPinchDistance = 0;
    this.touchStartAngle = 0;
    this.initialScale = 1;
    this.initialRotation = 0;

    this.onStateChange = options.onStateChange || (() => {});
    this.bindEvents();
    this.render();
  }

  /**
   * Loads user image from File, Blob, or ImageBitmap.
   * Respects EXIF orientation and downscales to <= 1024px on long edge.
   */
  async loadUserImage(fileOrBlob) {
    let sourceBitmap = null;

    if (fileOrBlob instanceof ImageBitmap) {
      sourceBitmap = fileOrBlob;
    } else {
      try {
        // Respect EXIF orientation
        sourceBitmap = await createImageBitmap(fileOrBlob, { imageOrientation: 'from-image' });
      } catch (err) {
        try {
          sourceBitmap = await createImageBitmap(fileOrBlob);
        } catch (bitmapErr) {
          sourceBitmap = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(fileOrBlob);
          });
        }
      }
    }

    // Downscale to <= 1024px on long edge for performance & memory efficiency
    const maxDim = 1024;
    let w = sourceBitmap.width || sourceBitmap.naturalWidth || 600;
    let h = sourceBitmap.height || sourceBitmap.naturalHeight || 800;

    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = w;
    scaledCanvas.height = h;
    const scaledCtx = scaledCanvas.getContext('2d');
    scaledCtx.drawImage(sourceBitmap, 0, 0, w, h);

    this.userImage = scaledCanvas;

    // Estimate ambient light direction and luminance
    const stats = computeLuminanceStats(scaledCanvas);
    this.lightInfo = estimateLight(stats);

    this.fitCanvasToImage();
    this.resetGarmentTransform();
    this.render();

    this.onStateChange({
      hasUserImage: true,
      userImage: this.userImage,
      lightInfo: this.lightInfo
    });

    return {
      image: this.userImage,
      lightInfo: this.lightInfo
    };
  }

  loadGarment(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.garmentImage = img;
        // If we don't already have an automatic placement, set default
        if (this.transform.scale === 1 && this.transform.x === 0 && this.transform.y === 0) {
          this.resetGarmentTransform();
        }
        this.render();
        this.onStateChange({ hasGarmentImage: true });
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Applies an automatic pose-derived placement.
   */
  setPlacement(placement) {
    if (!placement) return;
    this.transform.x = placement.x;
    this.transform.y = placement.y;
    this.transform.scale = placement.scale;
    this.transform.rotation = placement.rotation;
    this.render();
  }

  setLightInfo(info) {
    this.lightInfo = info;
    this.render();
  }

  fitCanvasToImage() {
    if (!this.userImage) {
      this.canvas.width = 600;
      this.canvas.height = 800;
      return;
    }

    this.canvas.width = this.userImage.width;
    this.canvas.height = this.userImage.height;
  }

  resetGarmentTransform() {
    if (!this.garmentImage) return;

    const cw = this.canvas.width || 600;
    const ch = this.canvas.height || 800;

    // Center garment over chest area
    this.transform.x = cw / 2;
    this.transform.y = ch * 0.52;

    // Scale garment to fill roughly 72% of canvas width
    const gw = this.garmentImage.naturalWidth || 600;
    const targetWidth = cw * 0.72;
    this.transform.scale = targetWidth / gw;
    this.transform.rotation = 0;
  }

  setManualScale(factor) {
    this.transform.scale = Math.max(0.15, Math.min(3.5, factor));
    this.render();
  }

  setManualRotation(degrees) {
    this.transform.rotation = (degrees * Math.PI) / 180;
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // 1. Draw User Photo or Neutral Studio Placeholder
    if (this.userImage) {
      ctx.drawImage(this.userImage, 0, 0, cw, ch);
    } else {
      // Elegant placeholder pattern
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, cw, ch);

      // Grid lines
      ctx.strokeStyle = 'rgba(184, 155, 106, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 40; x < cw; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
      for (let y = 40; y < ch; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#8A847C';
      ctx.font = '500 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload a photo or capture via camera to begin fitting', cw / 2, ch / 2);
    }

    // 2. Draw Garment Overlay with Light Matching & Soft Shadow
    if (this.garmentImage) {
      renderCompositedGarment(ctx, {
        garmentImage: this.garmentImage,
        userImage: this.userImage,
        transform: this.transform,
        lightInfo: this.lightInfo,
        canvasWidth: cw,
        canvasHeight: ch,
        isDragging: this.isDragging
      });
    }
  }

  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  bindEvents() {
    const el = this.canvas;

    // Pointer Events (Mouse / Single Touch)
    el.addEventListener('pointerdown', (e) => {
      if (!this.garmentImage) return;
      el.setPointerCapture(e.pointerId);
      this.isDragging = true;
      this.lastPointer = this.getCanvasCoordinates(e);
      this.render();
      this.onStateChange({ isAdjusting: true });
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isDragging || !this.garmentImage) return;
      const current = this.getCanvasCoordinates(e);
      const dx = current.x - this.lastPointer.x;
      const dy = current.y - this.lastPointer.y;

      this.transform.x += dx;
      this.transform.y += dy;
      this.lastPointer = current;
      this.render();
      this.onStateChange({ isAdjusting: true, transform: this.transform });
    });

    const pointerUpHandler = (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        try { el.releasePointerCapture(e.pointerId); } catch (err) {}
        this.render();
        this.onStateChange({ isAdjusting: false, transform: this.transform });
      }
    };

    el.addEventListener('pointerup', pointerUpHandler);
    el.addEventListener('pointercancel', pointerUpHandler);

    // Multi-touch gestures (Pinch-to-zoom and two-finger rotate)
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && this.garmentImage) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        this.touchPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        this.touchStartAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
        this.initialScale = this.transform.scale;
        this.initialRotation = this.transform.rotation;
        this.onStateChange({ isAdjusting: true });
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && this.garmentImage) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

        // Pinch scale
        if (this.touchPinchDistance > 0) {
          const factor = dist / this.touchPinchDistance;
          this.transform.scale = Math.max(0.15, Math.min(3.5, this.initialScale * factor));
        }

        // Two-finger rotate
        const angleDiff = angle - this.touchStartAngle;
        this.transform.rotation = this.initialRotation + angleDiff;

        this.render();
        this.onStateChange({ isAdjusting: true, transform: this.transform });
      }
    }, { passive: true });

    // Mouse wheel zoom
    el.addEventListener('wheel', (e) => {
      if (!this.garmentImage) return;
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      this.transform.scale = Math.max(0.15, Math.min(3.5, this.transform.scale * zoomFactor));
      this.render();
      this.onStateChange({ isAdjusting: true, transform: this.transform });
    }, { passive: false });
  }

  downloadResult(filename = 'apparel-by-ezekiel-tryon.png') {
    // Render final clean frame without interactive bounding lines
    this.isDragging = false;
    this.render();

    // Watermark with subtle luxury atelier text
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(246, 243, 238, 0.75)';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('APPAREL BY EZEKIEL • VIRTUAL ATELIER', this.canvas.width - 24, this.canvas.height - 24);
    ctx.restore();

    const dataUrl = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    this.render();
  }
}
