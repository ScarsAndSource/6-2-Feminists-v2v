import { useEffect, useRef } from 'react';

const STROKE = 'currentColor';

function WildflowerSprig() {
  return (
    <svg viewBox="0 0 120 160" fill="none" strokeWidth="1.4" strokeLinecap="round">
      <path d="M60 155 C 58 120, 64 90, 55 60 C 50 45, 58 30, 60 15" stroke={STROKE} />
      <path d="M60 60 C 48 55, 38 58, 30 48 C 26 43, 28 36, 34 34 C 42 32, 50 40, 52 52" stroke={STROKE} opacity="0.85" />
      <path d="M55 85 C 68 80, 78 84, 84 74 C 87 69, 84 62, 78 61 C 70 60, 63 68, 62 78" stroke={STROKE} opacity="0.85" />
      <circle cx="60" cy="15" r="4.5" stroke={STROKE} />
      <path d="M60 15 L52 6 M60 15 L68 5 M60 15 L60 3 M60 15 L48 12 M60 15 L72 13" stroke={STROKE} opacity="0.7" />
    </svg>
  );
}

function FernFrond() {
  return (
    <svg viewBox="0 0 100 180" fill="none" strokeWidth="1.2" strokeLinecap="round">
      <path d="M50 175 C 46 130, 52 90, 48 40 C 47 28, 50 15, 52 5" stroke={STROKE} />
      {Array.from({ length: 9 }).map((_, i) => {
        const y = 20 + i * 16;
        const len = 22 - i * 1.2;
        return (
          <g key={i} opacity={0.55 + (i % 3) * 0.1}>
            <path d={`M50 ${y} C ${50 - len * 0.6} ${y - 4}, ${50 - len} ${y + 6}, ${50 - len - 4} ${y + 14}`} stroke={STROKE} />
            <path d={`M50 ${y + 6} C ${50 + len * 0.6} ${y + 2}, ${50 + len} ${y + 12}, ${50 + len + 4} ${y + 20}`} stroke={STROKE} />
          </g>
        );
      })}
    </svg>
  );
}

function ChamomileBloom() {
  return (
    <svg viewBox="0 0 90 90" fill="none" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="45" cy="45" r="7" stroke={STROKE} />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = 45 + Math.cos(angle) * 10;
        const y1 = 45 + Math.sin(angle) * 10;
        const x2 = 45 + Math.cos(angle) * 24;
        const y2 = 45 + Math.sin(angle) * 24;
        const cx = 45 + Math.cos(angle + 0.25) * 17;
        const cy = 45 + Math.sin(angle + 0.25) * 17;
        return <path key={i} d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`} stroke={STROKE} opacity="0.8" />;
      })}
    </svg>
  );
}

function ThinVine() {
  return (
    <svg viewBox="0 0 200 60" fill="none" strokeWidth="1.2" strokeLinecap="round">
      <path d="M0 30 C 30 10, 50 50, 80 28 C 105 10, 125 48, 155 26 C 172 14, 185 30, 200 22" stroke={STROKE} />
      {[24, 68, 112, 156].map((x, i) => (
        <path
          key={i}
          d={`M${x} ${28 + (i % 2 === 0 ? -14 : 12)} C ${x - 4} ${20 + (i % 2 === 0 ? -14 : 12)}, ${x - 8} ${16 + (i % 2 === 0 ? -14 : 12)}, ${x - 10} ${8 + (i % 2 === 0 ? -14 : 12)}`}
          stroke={STROKE}
          opacity="0.7"
        />
      ))}
    </svg>
  );
}

function BentGrass() {
  return (
    <svg viewBox="0 0 60 140" fill="none" strokeWidth="1.3" strokeLinecap="round">
      <path d="M30 138 C 26 100, 40 70, 22 40 C 14 26, 20 12, 30 2" stroke={STROKE} />
      <path d="M30 138 C 34 105, 20 75, 36 46 C 44 32, 38 16, 30 2" stroke={STROKE} opacity="0.6" />
    </svg>
  );
}

interface SprigPlacement {
  Component: () => JSX.Element;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width: number;
  rotate: number;
  depth: number;
  swayDuration: number;
}

const PLACEMENTS: SprigPlacement[] = [
  { Component: WildflowerSprig, bottom: '-2%', left: '2%', width: 130, rotate: -8, depth: 0.9, swayDuration: 7 },
  { Component: FernFrond, bottom: '-4%', right: '4%', width: 100, rotate: 10, depth: 0.6, swayDuration: 9 },
  { Component: ChamomileBloom, top: '8%', right: '6%', width: 70, rotate: 15, depth: 0.3, swayDuration: 6 },
  { Component: ThinVine, top: '2%', left: '10%', width: 180, rotate: -4, depth: 0.4, swayDuration: 8 },
  { Component: BentGrass, bottom: '-1%', left: '22%', width: 55, rotate: -3, depth: 0.75, swayDuration: 6.5 },
];

export function BotanicalLayer({ tint = 'rgb(184, 51, 106)' }: { tint?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let frame = 0;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        layerRefs.current.forEach((el, i) => {
          if (!el) return;
          const depth = PLACEMENTS[i].depth;
          const shiftX = nx * depth * 14;
          const shiftY = ny * depth * 10;
          el.style.transform = `translate(${shiftX}px, ${shiftY}px) rotate(${PLACEMENTS[i].rotate}deg)`;
        });
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-[9] pointer-events-none overflow-hidden"
      style={{ color: tint }}
      aria-hidden="true"
    >
      {PLACEMENTS.map((p, i) => (
        <div
          key={i}
          ref={(el) => (layerRefs.current[i] = el)}
          className="absolute opacity-[0.16]"
          style={{
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            width: p.width,
            transform: `rotate(${p.rotate}deg)`,
            animation: `botanicalSway ${p.swayDuration}s ease-in-out infinite`,
            transformOrigin: 'bottom center',
          }}
        >
          <p.Component />
        </div>
      ))}
      <style>{`
        @keyframes botanicalSway {
          0%, 100% { rotate: 0deg; }
          50% { rotate: 1.4deg; }
        }
        @media (prefers-reduced-motion: reduce) {
          .botanical-sway-disabled { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
