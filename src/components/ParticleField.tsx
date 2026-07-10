import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'heart' | 'petal' | 'sparkle' | 'dot';
  color: string;
  wobble: number;
  wobbleSpeed: number;
  trail: { x: number; y: number; opacity: number }[];
}

const COLORS = [
  'rgba(244, 137, 180, ',  // rose-300
  'rgba(232, 103, 155, ',  // rose-400
  'rgba(248, 179, 207, ',  // rose-200
  'rgba(245, 196, 184, ',  // blush-300
  'rgba(252, 214, 227, ',  // rose-100
  'rgba(184, 138, 171, ',  // plum-400
  'rgba(238, 168, 154, ',  // blush-400
];

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  const s = size / 14;
  ctx.moveTo(0, -2 * s);
  ctx.bezierCurveTo(-4 * s, -8 * s, -12 * s, -4 * s, 0, 6 * s);
  ctx.bezierCurveTo(12 * s, -4 * s, 4 * s, -8 * s, 0, -2 * s);
  ctx.fill();
  ctx.restore();
}

function drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.4, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  const s = size / 2;
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.25, -s * 0.25);
  ctx.lineTo(s, 0);
  ctx.lineTo(s * 0.25, s * 0.25);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.25, s * 0.25);
  ctx.lineTo(-s, 0);
  ctx.lineTo(-s * 0.25, -s * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function ParticleField({ count = 16, focusMode }: { count?: number; focusMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationId = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const types: Particle['type'][] = ['heart', 'petal', 'sparkle', 'sparkle', 'dot'];
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height + height * 0.3,
        size: 5 + Math.random() * 16,
        speed: 0.2 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        opacity: 0.12 + Math.random() * 0.3,
        type: types[Math.floor(Math.random() * types.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.008 + Math.random() * 0.015,
        trail: [],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Store trail
        p.trail.push({ x: p.x, y: p.y, opacity: p.opacity * 0.3 });
        if (p.trail.length > 6) p.trail.shift();

        p.y -= p.speed;
        p.wobble += p.wobbleSpeed;
        p.x += p.drift + Math.sin(p.wobble) * 0.4;
        p.rotation += p.rotationSpeed;

        if (p.y < -50) {
          p.y = height + 50;
          p.x = Math.random() * width;
          p.trail = [];
        }
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;

        // Draw trail for sparkles and hearts
        if (p.type === 'sparkle' || p.type === 'heart') {
          for (let i = 0; i < p.trail.length; i++) {
            const t = p.trail[i];
            const trailOpacity = t.opacity * (i / p.trail.length) * 0.5;
            ctx.fillStyle = p.color + trailOpacity + ')';
            const trailSize = p.size * (i / p.trail.length) * 0.6;
            if (p.type === 'heart') {
              drawHeart(ctx, t.x, t.y, trailSize, p.rotation);
            } else {
              drawSparkle(ctx, t.x, t.y, trailSize, p.rotation);
            }
          }
        }

        // Draw main particle
        ctx.fillStyle = p.color + p.opacity + ')';

        if (p.type === 'heart') {
          drawHeart(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.type === 'petal') {
          drawPetal(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.type === 'sparkle') {
          drawSparkle(ctx, p.x, p.y, p.size, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ width: '100vw', height: '100vh', opacity: focusMode ? 0.3 : 1, transition: 'opacity 0.8s ease' }}
    />
  );
}
