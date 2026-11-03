/**
 * Virtual Try-On Canvas (Beta)
 * 100% on-device processing. No images uploaded.
 * Supports:
 * - Photo from file or live camera
 * - Design overlay garment selection
 * - Pointer drag, scale, and rotate
 * - Multi-touch pinch-to-zoom and two-finger rotate
 * - Canvas export / download as high-res PNG
 */

export class VirtualTryOn {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.userImage = null;
    this.garmentImage = null;

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

  loadUserImage(fileOrBlob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.userImage = img;
        this.fitCanvasToImage();
        this.resetGarmentTransform();
        this.render();
        this.onStateChange({ hasUserImage: true });
        resolve(img);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(fileOrBlob);
    });
  }

  loadGarment(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.garmentImage = img;
        this.resetGarmentTransform();
        this.render();
        this.onStateChange({ hasGarmentImage: true });
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  fitCanvasToImage() {
    if (!this.userImage) {
      this.canvas.width = 600;
      this.canvas.height = 800;
      return;
    }

    // Set internal resolution up to 1200 max dimension for sharp rendering
    const maxDim = 1200;
    let w = this.userImage.naturalWidth || 600;
    let h = this.userImage.naturalHeight || 800;

    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    this.canvas.width = w;
    this.canvas.height = h;
  }

  resetGarmentTransform() {
    if (!this.garmentImage) return;

    const cw = this.canvas.width || 600;
    const ch = this.canvas.height || 800;

    // Center garment over chest area (approx 45% down)
    this.transform.x = cw / 2;
    this.transform.y = ch * 0.52;

    // Scale garment to fill roughly 65% of canvas width
    const gw = this.garmentImage.naturalWidth || 600;
    const targetWidth = cw * 0.72;
    this.transform.scale = targetWidth / gw;
    this.transform.rotation = 0;
  }

  setManualScale(factor) {
    this.transform.scale = Math.max(0.2, Math.min(3.5, factor));
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

    // 2. Draw Garment Overlay
    if (this.garmentImage) {
      ctx.save();
      ctx.translate(this.transform.x, this.transform.y);
      ctx.rotate(this.transform.rotation);
      ctx.scale(this.transform.scale, this.transform.scale);

      const gw = this.garmentImage.naturalWidth || 600;
      const gh = this.garmentImage.naturalHeight || 750;

      // Draw centered around the anchor point
      ctx.drawImage(this.garmentImage, -gw / 2, -gh / 2, gw, gh);

      // Subtle transform bounding frame when dragging
      if (this.isDragging) {
        ctx.strokeStyle = 'rgba(184, 155, 106, 0.6)';
        ctx.lineWidth = 2 / this.transform.scale;
        ctx.strokeRect(-gw / 2, -gh / 2, gw, gh);
      }

      ctx.restore();
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
    });

    const pointerUpHandler = (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        try { el.releasePointerCapture(e.pointerId); } catch (err) {}
        this.render();
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
          this.transform.scale = Math.max(0.2, Math.min(3.5, this.initialScale * factor));
        }

        // Two-finger rotate
        const angleDiff = angle - this.touchStartAngle;
        this.transform.rotation = this.initialRotation + angleDiff;

        this.render();
      }
    }, { passive: true });

    // Mouse wheel zoom
    el.addEventListener('wheel', (e) => {
      if (!this.garmentImage) return;
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      this.transform.scale = Math.max(0.2, Math.min(3.5, this.transform.scale * zoomFactor));
      this.render();
    }, { passive: false });
  }

  downloadResult(filename = 'apparel-by-ezekiel-tryon.png') {
    // Render final clean frame without debug bounding lines
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
