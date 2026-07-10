import type { JourneyStage } from '../hooks/useJourney';
const stages: { id: JourneyStage; label: string }[] = [
  { id: 'landing', label: 'Landing' }, { id: 'log', label: 'Log Symptoms' }, { id: 'report', label: 'Your Report' }, { id: 'suggestions', label: 'AI Suggestions' }, { id: 'helper', label: 'AI Soother' }, { id: 'patterns', label: 'Your Patterns' }, { id: 'doctor', label: 'When to See a Doctor' }
];
export function JourneyRail({ stage, onChange }: { stage: JourneyStage; onChange: (stage: JourneyStage) => void }) {
  return <nav aria-label="Your journey" className="sticky top-[64px] z-40 border-b border-rose-200/70 bg-rose-50/95 backdrop-blur"><div className="max-w-5xl mx-auto px-3 overflow-x-auto"><ol className="flex min-w-max">{stages.map((item, index) => <li key={item.id} className="flex items-center"><button onClick={() => onChange(item.id)} aria-current={stage === item.id ? 'step' : undefined} className={`flex items-center gap-2 px-3 py-3 text-xs font-semibold transition-colors ${stage === item.id ? 'text-rose-700' : 'text-rose-400 hover:text-rose-600'}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${stage === item.id ? 'bg-rose-500 text-white' : 'bg-rose-100'}`}>{index + 1}</span>{item.label}</button>{index < stages.length - 1 && <span className="h-px w-3 bg-rose-200" />}</li>)}</ol></div></nav>;
}
