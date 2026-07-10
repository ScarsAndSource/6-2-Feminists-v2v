import { todayKey } from './dateUtils';

export interface ComfortSuggestion {
  id: string;
  tag: string;
  text: string;
}

export const COMFORT_SUGGESTIONS: Record<string, ComfortSuggestion[]> = {
  bloating: [
    { id: 'bloat-1', tag: 'bloating', text: 'Peppermint or ginger tea after meals' },
    { id: 'bloat-2', tag: 'bloating', text: 'A short walk after eating' },
    { id: 'bloat-3', tag: 'bloating', text: 'A warm compress on your abdomen' },
    { id: 'bloat-4', tag: 'bloating', text: 'Loose, comfortable clothing today' }
  ],
  nausea: [
    { id: 'nau-1', tag: 'nausea', text: 'Ginger tea or ginger chews' },
    { id: 'nau-2', tag: 'nausea', text: 'Smaller, more frequent meals' },
    { id: 'nau-3', tag: 'nausea', text: 'Fresh air or sitting by an open window' },
    { id: 'nau-4', tag: 'nausea', text: 'Plain crackers or toast if food feels off' }
  ],
  pelvic_pain: [
    { id: 'pel-1', tag: 'pelvic_pain', text: 'A heating pad or warm bath' },
    { id: 'pel-2', tag: 'pelvic_pain', text: "Gentle stretching or child's pose" },
    { id: 'pel-3', tag: 'pelvic_pain', text: 'Magnesium-rich foods like dark chocolate or almonds' },
    { id: 'pel-4', tag: 'pelvic_pain', text: 'Lying down with your knees supported by a pillow' }
  ],
  headache: [
    { id: 'head-1', tag: 'headache', text: 'A full glass of water - dehydration is a common trigger' },
    { id: 'head-2', tag: 'headache', text: 'Resting in a dim, quiet room for a few minutes' },
    { id: 'head-3', tag: 'headache', text: 'A cool compress on your forehead' },
    { id: 'head-4', tag: 'headache', text: 'Stepping away from screens for a bit' }
  ],
  fatigue: [
    { id: 'fat-1', tag: 'fatigue', text: 'An earlier bedtime tonight' },
    { id: 'fat-2', tag: 'fatigue', text: 'A short walk outside for natural light' },
    { id: 'fat-3', tag: 'fatigue', text: 'Iron-rich foods if this keeps happening' },
    { id: 'fat-4', tag: 'fatigue', text: 'Giving yourself permission to do less today' }
  ],
  mood_change: [
    { id: 'mood-1', tag: 'mood_change', text: "A few minutes of journaling what you're feeling" },
    { id: 'mood-2', tag: 'mood_change', text: 'Gentle movement or stretching' },
    { id: 'mood-3', tag: 'mood_change', text: 'Reaching out to someone you trust' },
    { id: 'mood-4', tag: 'mood_change', text: 'A favorite song or show, just for comfort' }
  ],
  sleep_disturbance: [
    { id: 'sleep-1', tag: 'sleep_disturbance', text: 'A consistent wind-down routine tonight' },
    { id: 'sleep-2', tag: 'sleep_disturbance', text: 'Limiting screens an hour before bed' },
    { id: 'sleep-3', tag: 'sleep_disturbance', text: 'Chamomile tea before sleep' },
    { id: 'sleep-4', tag: 'sleep_disturbance', text: 'Keeping your room a little cooler tonight' }
  ],
  back_pain: [
    { id: 'back-1', tag: 'back_pain', text: 'A warm compress on the area' },
    { id: 'back-2', tag: 'back_pain', text: 'Gentle stretching, especially your lower back' },
    { id: 'back-3', tag: 'back_pain', text: 'Checking your sitting posture today' },
    { id: 'back-4', tag: 'back_pain', text: 'A firmer pillow or support under your knees at night' }
  ],
  joint_pain: [
    { id: 'joint-1', tag: 'joint_pain', text: 'Gentle range-of-motion stretches' },
    { id: 'joint-2', tag: 'joint_pain', text: 'A warm bath or shower' },
    { id: 'joint-3', tag: 'joint_pain', text: 'Anti-inflammatory foods like berries and leafy greens' },
    { id: 'joint-4', tag: 'joint_pain', text: 'Resting the joint rather than pushing through it' }
  ],
  digestive_issue: [
    { id: 'dig-1', tag: 'digestive_issue', text: 'Peppermint tea' },
    { id: 'dig-2', tag: 'digestive_issue', text: 'Smaller, more frequent meals' },
    { id: 'dig-3', tag: 'digestive_issue', text: 'Avoiding very fatty or spicy food today' },
    { id: 'dig-4', tag: 'digestive_issue', text: 'A warm (not hot) drink with meals' }
  ],
  dizziness: [
    { id: 'diz-1', tag: 'dizziness', text: 'Sitting or lying down until it passes' },
    { id: 'diz-2', tag: 'dizziness', text: 'A glass of water' },
    { id: 'diz-3', tag: 'dizziness', text: 'Standing up slowly from sitting or lying down' },
    { id: 'diz-4', tag: 'dizziness', text: 'A snack if it\'s been a while since you ate' }
  ],
  breast_tenderness: [
    { id: 'breast-1', tag: 'breast_tenderness', text: 'A well-fitted, soft support bra today' },
    { id: 'breast-2', tag: 'breast_tenderness', text: 'A warm compress' },
    { id: 'breast-3', tag: 'breast_tenderness', text: 'Cutting back on caffeine today if you can' },
    { id: 'breast-4', tag: 'breast_tenderness', text: 'Looser layers over that area' }
  ],
  acne: [
    { id: 'acne-1', tag: 'acne', text: 'A gentle, fragrance-free cleanser tonight' },
    { id: 'acne-2', tag: 'acne', text: 'Resisting the urge to pick - it usually helps healing' },
    { id: 'acne-3', tag: 'acne', text: 'A clean pillowcase tonight' },
    { id: 'acne-4', tag: 'acne', text: 'Reminding yourself this is hormonal, not something you did' }
  ],
  food_cravings: [
    { id: 'crave-1', tag: 'food_cravings', text: "It's okay to have what you're craving in a portion that feels good" },
    { id: 'crave-2', tag: 'food_cravings', text: 'Pairing a craving with some protein to feel more satisfied' },
    { id: 'crave-3', tag: 'food_cravings', text: 'Staying hydrated - thirst sometimes shows up as cravings' },
    { id: 'crave-4', tag: 'food_cravings', text: 'Not fighting it too hard - restriction usually backfires' }
  ],
  leg_cramps: [
    { id: 'leg-1', tag: 'leg_cramps', text: 'Gently stretching your calf' },
    { id: 'leg-2', tag: 'leg_cramps', text: 'A warm bath' },
    { id: 'leg-3', tag: 'leg_cramps', text: 'Staying hydrated through the day' },
    { id: 'leg-4', tag: 'leg_cramps', text: 'Elevating your legs for a few minutes' }
  ],
  hot_flashes: [
    { id: 'hot-1', tag: 'hot_flashes', text: 'Layers you can easily remove' },
    { id: 'hot-2', tag: 'hot_flashes', text: 'A cool glass of water nearby' },
    { id: 'hot-3', tag: 'hot_flashes', text: 'A small fan or open window' },
    { id: 'hot-4', tag: 'hot_flashes', text: 'Breathable, natural fabrics today' }
  ],
  brain_fog: [
    { id: 'fog-1', tag: 'brain_fog', text: 'Breaking tasks into smaller steps today' },
    { id: 'fog-2', tag: 'brain_fog', text: 'A short break and some water' },
    { id: 'fog-3', tag: 'brain_fog', text: 'Writing things down rather than relying on memory today' },
    { id: 'fog-4', tag: 'brain_fog', text: 'Being a little extra patient with yourself right now' }
  ],
  constipation: [
    { id: 'const-1', tag: 'constipation', text: 'Extra water through the day' },
    { id: 'const-2', tag: 'constipation', text: 'A short walk' },
    { id: 'const-3', tag: 'constipation', text: 'Fiber-rich foods like fruit or oats if they sit well with you' },
    { id: 'const-4', tag: 'constipation', text: 'Not rushing - give your body time' }
  ],
  diarrhea: [
    { id: 'diar-1', tag: 'diarrhea', text: 'Staying hydrated, small sips throughout the day' },
    { id: 'diar-2', tag: 'diarrhea', text: 'Bland, easy foods for now' },
    { id: 'diar-3', tag: 'diarrhea', text: 'Resting rather than pushing through errands' },
    { id: 'diar-4', tag: 'diarrhea', text: 'Avoiding very fatty or spicy food today' }
  ],
  water_retention: [
    { id: 'water-1', tag: 'water_retention', text: 'Elevating your feet for a bit' },
    { id: 'water-2', tag: 'water_retention', text: 'Reducing salty food today if you can' },
    { id: 'water-3', tag: 'water_retention', text: 'Staying hydrated - it sounds backwards but it helps' },
    { id: 'water-4', tag: 'water_retention', text: 'Loose, comfortable clothing and footwear' }
  ],
  appetite_change: [
    { id: 'app-1', tag: 'appetite_change', text: 'Small, simple meals rather than forcing a full plate' },
    { id: 'app-2', tag: 'appetite_change', text: 'Eating what sounds good over what "should" sound good' },
    { id: 'app-3', tag: 'appetite_change', text: 'A gentle reminder to eat something even if hunger feels off' },
    { id: 'app-4', tag: 'appetite_change', text: 'Not worrying too much - appetite swings are common with this' }
  ],
  anxiety_physical: [
    { id: 'anxphys-1', tag: 'anxiety_physical', text: 'A slow breath in for 4, out for 6, a few times' },
    { id: 'anxphys-2', tag: 'anxiety_physical', text: 'Splashing cool water on your wrists or face' },
    { id: 'anxphys-3', tag: 'anxiety_physical', text: 'Naming 3 things you can see around you right now' },
    { id: 'anxphys-4', tag: 'anxiety_physical', text: 'Stepping outside for a minute if you can' }
  ]
};

function pickFromPool(pool: ComfortSuggestion[], count: number, seed: number): ComfortSuggestion[] {
  if (pool.length <= count) return pool;
  const start = seed % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

export function pickComfortSuggestions(tagFrequency: { tag: string; count: number }[]): ComfortSuggestion[] {
  const withSuggestions = tagFrequency.filter(t => COMFORT_SUGGESTIONS[t.tag]);
  const top = withSuggestions.slice(0, 2);
  const daySeed = Number(todayKey().replace(/-/g, ''));
  return top.flatMap(t => pickFromPool(COMFORT_SUGGESTIONS[t.tag], 2, daySeed + t.tag.length));
}
