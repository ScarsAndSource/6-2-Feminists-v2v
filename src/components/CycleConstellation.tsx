import { useMemo } from 'react';
import type { Entry } from '../lib/types';

interface CycleConstellationProps {
  entries: Entry[];
  size?: number;
}

const CYCLE_LENGTH = 28;
const PHASE_COLORS = [
  { color: '#e8679b' },
  { color: '#b8366a' },
  { color: '#c9517c' },
  { color: '#a02b58' },
];

const PHASE_ANGLES = [0, 90, 180, 270] as const;

function getPhaseColor(cycleDay: number | null): string {
  if (cycleDay === null || cycleDay === undefined) return '#9ca3af';
  if (cycleDay <= 7) return PHASE_COLORS[0].color;
  if (cycleDay <= 14) return PHASE_COLORS[1].color;
  if (cycleDay <= 21) return PHASE_COLORS[2].color;
  return PHASE_COLORS[3].color;
}

function getAngle(cycleDay: number | null, index: number, total: number): number {
  if (cycleDay !== null && cycleDay !== undefined) {
    return (cycleDay / CYCLE_LENGTH) * 360;
  }
  return (index / total) * 360 + 15;
}

export function CycleConstellation({ entries, size = 80 }: CycleConstellationProps) {
  const dots = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const total = sorted.length;
    const now = Date.now();

    return sorted.map((entry, i) => {
      const angleDeg = getAngle(entry.cycle_day, i, total);
      const angleRad = (angleDeg - 90) * (Math.PI / 180);
      const radius = entry.cycle_day !== null && entry.cycle_day !== undefined ? 28 : 12;
      const x = size / 2 + Math.cos(angleRad) * radius;
      const y = size / 2 + Math.sin(angleRad) * radius;
      const ageHours = (now - new Date(entry.created_at).getTime()) / 36e5;
      const opacity = Math.max(0.3, 1 - ageHours / 720);
      const dotRadius = Math.max(2, 3 - (total - i) * 0.04);
      return {
        x, y, r: dotRadius,
        fill: entry.cycle_day !== null && entry.cycle_day !== undefined
          ? getPhaseColor(entry.cycle_day)
          : '#9ca3af',
        opacity,
        cycleDay: entry.cycle_day,
      };
    });
  }, [entries, size]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-label={`${entries.length} symptom entries visualized by cycle day`}
    >
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      {PHASE_COLORS.map((p, i) => {
        const angleRad = (PHASE_ANGLES[i] - 90) * (Math.PI / 180);
        const labelR = size / 2 - 4;
        const lx = size / 2 + Math.cos(angleRad) * labelR;
        const ly = size / 2 + Math.sin(angleRad) * labelR;
        return (
            <circle
              key={i}
            cx={lx}
            cy={ly}
            r={1.5}
            fill={p.color}
            opacity={0.4}
          />
        );
      })}
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill={dot.fill}
          opacity={dot.opacity}
        />
      ))}
      {dots.length === 0 && (
        <circle cx={size / 2} cy={size / 2} r={3} fill="#e2e8f0" opacity={0.5} />
      )}
    </svg>
  );
}
