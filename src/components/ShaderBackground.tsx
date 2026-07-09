import { useEffect, useRef } from 'react';

/**
 * Multi-layer animated background:
 * 1. Flowing organic gradient blobs (drift + breathe)
 * 2. Subtle wave distortion layer using sine fields
 * 3. Soft noise grain for texture
 * Everything composited with 'screen' and 'lighter' blend modes
 * for smooth, painterly color mixing.
 */
export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationId = 0;
    let time = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Blob {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: [number, number, number];
      pulse: number;
      pulseSpeed: number;
      orbitRadius: number;
      orbitSpeed: number;
      orbitAngle: number;
      centerX: number;
      centerY: number;
    }

    // Rose/pink/blush/plum palette as RGB
    const palette: [number, number, number][] = [
      [244, 137, 180],  // rose-300
      [232, 103, 155],  // rose-400
      [252, 214, 227],  // rose-100
      [245, 196, 184],  // blush-300
      [184, 138, 171],  // plum-400
      [248, 179, 207],  // rose-200
      [238, 168, 154],  // blush-400
      [212, 69, 127],   // rose-500
    ];

    const blobs: Blob[] = [];
    for (let i = 0; i < 7; i++) {
      const cx = width * (0.15 + Math.random() * 0.7);
      const cy = height * (0.15 + Math.random() * 0.7);
      blobs.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: 180 + Math.random() * 280,
        color: palette[i % palette.length],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.003 + Math.random() * 0.008,
        orbitRadius: 40 + Math.random() * 80,
        orbitSpeed: 0.0008 + Math.random() * 0.0015,
        orbitAngle: Math.random() * Math.PI * 2,
        centerX: cx,
        centerY: cy,
      });
    }

    // Pre-render a noise texture tile
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128;
    noiseCanvas.height = 128;
    const noiseCtx = noiseCanvas.getContext('2d');
    if (noiseCtx) {
      const imageData = noiseCtx.createImageData(128, 128);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 255;
        imageData.data[i] = v;
        imageData.data[i + 1] = v;
        imageData.data[i + 2] = v;
        imageData.data[i + 3] = 8; // very subtle
      }
      noiseCtx.putImageData(imageData, 0, 0);
    }

    const render = () => {
      time += 0.002;

      // Base wash — warm cream
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fef7f4';
      ctx.fillRect(0, 0, width, height);

      // Layer 1: Large soft blobs with 'lighter' blend for smooth color mixing
      ctx.globalCompositeOperation = 'lighter';

      for (const blob of blobs) {
        blob.orbitAngle += blob.orbitSpeed;
        blob.pulse += blob.pulseSpeed;

        blob.x = blob.centerX + Math.cos(blob.orbitAngle) * blob.orbitRadius;
        blob.y = blob.centerY + Math.sin(blob.orbitAngle * 1.3) * blob.orbitRadius * 0.7;

        const pulseFactor = 1 + Math.sin(blob.pulse) * 0.18;
        const r = blob.radius * pulseFactor;

        const [cr, cg, cb] = blob.color;
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, r
        );
        gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.22)`);
        gradient.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, 0.10)`);
        gradient.addColorStop(0.7, `rgba(${cr}, ${cg}, ${cb}, 0.03)`);
        gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Layer 2: Flowing wave field — subtle horizontal bands that shift
      ctx.globalCompositeOperation = 'overlay';
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const yOffset = height * (0.2 + w * 0.3);
        const amplitude = 30 + w * 15;
        const wavelength = 400 + w * 200;
        const speed = time * (0.5 + w * 0.2);

        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= width; x += 4) {
          const y = yOffset +
            Math.sin((x + speed * 100) / wavelength) * amplitude +
            Math.cos((x + speed * 60) / (wavelength * 0.7)) * amplitude * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const [wr, wg, wb] = palette[(w + 3) % palette.length];
        const waveGrad = ctx.createLinearGradient(0, yOffset - amplitude, 0, height);
        waveGrad.addColorStop(0, `rgba(${wr}, ${wg}, ${wb}, 0.04)`);
        waveGrad.addColorStop(1, `rgba(${wr}, ${wg}, ${wb}, 0)`);
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      // Layer 3: Noise grain for organic texture
      ctx.globalCompositeOperation = 'overlay';
      if (noiseCanvas) {
        const pattern = ctx.createPattern(noiseCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Layer 4: Vignette — soft darkening at edges for depth
      ctx.globalCompositeOperation = 'source-over';
      const vignette = ctx.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.3,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(90, 20, 50, 0.06)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
