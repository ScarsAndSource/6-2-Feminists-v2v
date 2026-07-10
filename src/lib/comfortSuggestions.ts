export interface ComfortSuggestion { id: string; tag: string; text: string; }
export const COMFORT_SUGGESTIONS: Record<string, ComfortSuggestion[]> = {
  bloating: [{ id: 'bloat-tea', tag: 'bloating', text: 'Peppermint or ginger tea after meals' }, { id: 'bloat-walk', tag: 'bloating', text: 'A short walk after eating' }],
  nausea: [{ id: 'nausea-ginger', tag: 'nausea', text: 'Ginger tea or ginger chews' }, { id: 'nausea-air', tag: 'nausea', text: 'Fresh air or sitting by an open window' }],
  pelvic_pain: [{ id: 'pelvic-warmth', tag: 'pelvic_pain', text: 'A heating pad or warm bath' }, { id: 'pelvic-stretch', tag: 'pelvic_pain', text: 'Gentle stretching or child’s pose' }],
  headache: [{ id: 'head-water', tag: 'headache', text: 'A full glass of water' }, { id: 'head-rest', tag: 'headache', text: 'Resting in a dim, quiet room for a few minutes' }],
  fatigue: [{ id: 'fatigue-rest', tag: 'fatigue', text: 'An earlier bedtime tonight' }, { id: 'fatigue-light', tag: 'fatigue', text: 'A short walk outside for natural light' }],
  mood_change: [{ id: 'mood-journal', tag: 'mood_change', text: 'A few minutes of journaling what you’re feeling' }, { id: 'mood-move', tag: 'mood_change', text: 'Gentle movement or stretching' }],
  sleep_disturbance: [{ id: 'sleep-routine', tag: 'sleep_disturbance', text: 'A consistent wind-down routine tonight' }, { id: 'sleep-screens', tag: 'sleep_disturbance', text: 'Limiting screens an hour before bed' }],
  back_pain: [{ id: 'back-warmth', tag: 'back_pain', text: 'A warm compress on the area' }, { id: 'back-stretch', tag: 'back_pain', text: 'Gentle lower-back stretching' }],
  joint_pain: [{ id: 'joint-motion', tag: 'joint_pain', text: 'Gentle range-of-motion stretches' }, { id: 'joint-bath', tag: 'joint_pain', text: 'A warm bath or shower' }],
  digestive_issue: [{ id: 'digestive-tea', tag: 'digestive_issue', text: 'Peppermint tea' }, { id: 'digestive-meals', tag: 'digestive_issue', text: 'Smaller, more frequent meals' }],
  dizziness: [{ id: 'dizzy-rest', tag: 'dizziness', text: 'Sitting or lying down until it passes' }, { id: 'dizzy-water', tag: 'dizziness', text: 'A glass of water' }]
};
export function pickComfortSuggestions(frequency: { tag: string; count: number }[]) { return frequency.filter(item => COMFORT_SUGGESTIONS[item.tag]).slice(0, 2).flatMap(item => COMFORT_SUGGESTIONS[item.tag].slice(0, 2)); }
