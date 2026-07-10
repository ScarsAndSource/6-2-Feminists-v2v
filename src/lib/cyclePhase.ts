export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | null;

export interface PhaseTheme {
  label: string;
  ink: [string, string, string];
  accent: string;
  glow: string;
}

export function getCyclePhase(cycleDay: number | null | undefined): CyclePhase {
  if (cycleDay == null || cycleDay < 1) return null;
  const day = ((cycleDay - 1) % 28) + 1;
  if (day <= 5) return 'menstrual';
  if (day <= 13) return 'follicular';
  if (day <= 16) return 'ovulation';
  return 'luteal';
}

export const PHASE_THEME: Record<Exclude<CyclePhase, null>, PhaseTheme> = {
  menstrual: {
    label: 'Resting',
    ink: ['#7a1d48', '#b8336a', '#e8679b'],
    accent: '#9c2a5a',
    glow: 'rgba(122, 29, 72, 0.28)',
  },
  follicular: {
    label: 'Rising',
    ink: ['#e8679b', '#f489b4', '#fadcd4'],
    accent: '#e08a7a',
    glow: 'rgba(232, 103, 155, 0.22)',
  },
  ovulation: {
    label: 'Bright',
    ink: ['#d4457f', '#f489b4', '#d4b3c8'],
    accent: '#b88aab',
    glow: 'rgba(212, 69, 127, 0.3)',
  },
  luteal: {
    label: 'Settling',
    ink: ['#7d5070', '#9c6b8e', '#d4b3c8'],
    accent: '#7d5070',
    glow: 'rgba(125, 80, 112, 0.26)',
  },
};

export const NEUTRAL_THEME: PhaseTheme = {
  label: 'Neutral',
  ink: ['#e8679b', '#f489b4', '#fcd6e3'],
  accent: '#e8679b',
  glow: 'rgba(232, 103, 155, 0.2)',
};

export function themeForPhase(phase: CyclePhase): PhaseTheme {
  return phase ? PHASE_THEME[phase] : NEUTRAL_THEME;
}
