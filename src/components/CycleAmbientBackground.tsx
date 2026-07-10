import { useEffect, useRef } from 'react';
import { themeForPhase, type CyclePhase } from '../lib/cyclePhase';

interface CycleAmbientBackgroundProps {
  phase: CyclePhase;
  focusMode?: boolean;
}

interface InkBleed {
  cx: number;
  cy: number;
  baseRadius: number;
  points: number;
  seedOffsets: number[];
  wobblePhase: number;
  wobbleSpeed: number;
  driftAngle: number;
  driftSpeed: number;
  driftRadius: number;
  colorIndex: 0 | 1 | 2;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function traceOrganicPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  pointCount: number,
  seedOffsets: number[],
  wobble: number
) {
  const raw: { x: number; y: number }[] = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const seed = seedOffsets[i];
    const wobbleAmt = Math.sin(wobble + seed * 6.28) * 0.18;
    const r = baseRadius * (0.72 + seed * 0.56 + wobbleAmt);
    raw.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  ctx.beginPath();
  const first = raw[0];
  const last = raw[raw.length - 1];
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  for (let i = 0; i < raw.length; i++) {
    const curr = raw[i];
    const next = raw[(i + 1) % raw.length];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }
  ctx.closePath();
}

export function CycleAmbientBackground({ phase, focusMode }: CycleAmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(themeForPhase(phase));
  const displayedInk = useRef<[number, number, number][]>(
    themeForPhase(phase).ink.map(hexToRgb)
  );

  useEffect(() => {
    themeRef.current = themeForPhase(phase);
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationId = 0;
    let time = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const bleeds: InkBleed[] = [];
    const bleedCount = 5;
    for (let i = 0; i < bleedCount; i++) {
      const seedOffsets = Array.from({ length: 9 }, () => Math.random());
      bleeds.push({
        cx: width * (0.12 + Math.random() * 0.76),
        cy: height * (0.1 + Math.random() * 0.8),
        baseRadius: 220 + Math.random() * 260,
        points: 9,
        seedOffsets,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.0025 + Math.random() * 0.004,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: reduceMotion ? 0 : 0.0004 + Math.random() * 0.0006,
        driftRadius: 30 + Math.random() * 50,
        colorIndex: (i % 3) as 0 | 1 | 2,
      });
    }

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
        imageData.data[i + 3] = 7;
      }
      noiseCtx.putImageData(imageData, 0, 0);
    }

    const render = () => {
      time += 0.001;

      const targetInk = themeRef.current.ink.map(hexToRgb);
      for (let c = 0; c < 3; c++) {
        for (let ch = 0; ch < 3; ch++) {
          displayedInk.current[c][ch] +=
            (targetInk[c][ch] - displayedInk.current[c][ch]) * 0.01;
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fefcfa';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'multiply';
      for (const bleed of bleeds) {
        bleed.driftAngle += bleed.driftSpeed;
        bleed.wobblePhase += reduceMotion ? 0 : bleed.wobbleSpeed;

        const x = bleed.cx + Math.cos(bleed.driftAngle) * bleed.driftRadius;
        const y = bleed.cy + Math.sin(bleed.driftAngle * 1.4) * bleed.driftRadius * 0.6;

        traceOrganicPath(
          ctx,
          x,
          y,
          bleed.baseRadius,
          bleed.points,
          bleed.seedOffsets,
          bleed.wobblePhase
        );

        const [r, g, b] = displayedInk.current[bleed.colorIndex];
        const grad = ctx.createRadialGradient(x, y, 0, x, y, bleed.baseRadius * 1.1);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.16)`);
        grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.07)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'overlay';
      if (noiseCanvas) {
        const pattern = ctx.createPattern(noiseCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
      }

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
      style={{ width: '100vw', height: '100vh', opacity: focusMode ? 0.3 : 1, transition: 'opacity 0.8s ease' }}
      aria-hidden="true"
    />
  );
}
