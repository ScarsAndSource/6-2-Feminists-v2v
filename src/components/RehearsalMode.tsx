import { MessageCircle, ChevronRight, RefreshCw, Lightbulb, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import type { ComputedStats } from '../lib/types';
import { TAG_LABELS } from '../lib/types';

interface RehearsalModeProps {
  stats: ComputedStats | null;
}

export function RehearsalMode({ stats }: RehearsalModeProps) {
  if (!stats || stats.entry_count < 3) {
    return (
      <div className="text-center py-12 px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/60 border border-rose-200/50 mb-6 shadow-soft float-element">
          <MessageCircle className="w-8 h-8 text-rose-300" />
        </div>
        <h3 className="text-lg font-display font-semibold text-rose-950 mb-2">Build Your Data First</h3>
        <p className="text-rose-500 mb-6 max-w-sm mx-auto text-sm">
          Log at least 3 symptom entries to unlock Practice Mode and get personalized interview questions
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-sm text-rose-500 border border-rose-200/50">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="text-rose-600 font-bold">{stats?.entry_count || 0}/3</span>
          <span>entries needed</span>
        </div>
      </div>
    );
  }

  const questions = generateQuestions(stats);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-blush-400 to-blush-600 mb-4 shadow-glow-coral bloom">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-display font-semibold text-rose-950 mb-1">Practice Your Appointment</h3>
        <p className="text-sm text-rose-500 max-w-sm mx-auto">
          These questions are based on your logged patterns. Practice answering to feel confident during your visit.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={i}
            className="group rise-fade"
            style={{ animationDelay: `${i * 120}ms`, opacity: 0 }}
          >
            <div className="bg-white/60 border border-rose-200/50 hover:border-rose-300/60 rounded-2xl p-5 transition-all duration-300 hover:bg-white hover:shadow-soft hover:translate-x-1 shimmer-overlay">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 border border-rose-200 flex items-center justify-center shadow-soft group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <span className="text-rose-600 font-bold text-sm">{i + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-rose-950 font-medium mb-2">{q.question}</p>
                  <div className="flex items-center gap-2 text-xs text-rose-400">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500/70 twinkle" />
                    <span className="italic">{q.context}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-8 p-5 bg-gradient-to-br from-rose-50/60 to-blush-50/40 border border-rose-200/50 rounded-2xl rise-fade" style={{ animationDelay: '500ms', opacity: 0 }}>
        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-700 mb-3">
          <CheckCircle2 className="w-4 h-4 text-rose-500" />
          Tips for Your Appointment
        </h4>
        <ul className="space-y-2.5 text-sm text-rose-600">
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Be specific about timing — "every morning for 3 weeks" is more useful than "sometimes"</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Describe severity in impact terms — "keeps me from working" vs "just annoying"</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Mention what makes it better or worse, even if you discovered it by accident</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Your Case File has exact numbers your doctor will want to know</span>
          </li>
        </ul>
      </div>

      {/* Regenerate */}
      <div className="text-center pt-4">
        <button
          onClick={() => window.location.reload()}
          className="group inline-flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-rose-500 hover:text-rose-800 rounded-full text-sm transition-all border border-rose-200/50 hover:scale-105"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          New Questions
        </button>
      </div>
    </div>
  );
}

function generateQuestions(stats: ComputedStats): { question: string; context: string }[] {
  const questions: { question: string; context: string }[] = [];

  const topTags = stats.tag_frequency.filter(t => t.tag !== 'other');
  if (topTags.length > 0) {
    const top = topTags[0];
    const label = TAG_LABELS[top.tag] || top.tag.replace(/_/g, ' ');
    questions.push({
      question: `You mentioned ${label.toLowerCase()} ${top.count} time${top.count > 1 ? 's' : ''}. Can you describe what a typical episode feels like?`,
      context: `${top.count} occurrences logged`
    });
  }

  if (topTags.length > 1) {
    const second = topTags[1];
    const label = TAG_LABELS[second.tag] || second.tag.replace(/_/g, ' ');
    questions.push({
      question: `How does ${label.toLowerCase()} compare in severity to other symptoms you've tracked?`,
      context: `${second.count} occurrences, second most frequent`
    });
  }

  const strongCo = stats.co_occurrence.find(c => !c.low_confidence && c.n >= 3);
  if (strongCo) {
    const tagA = TAG_LABELS[strongCo.tag_a] || strongCo.tag_a;
    const tagB = TAG_LABELS[strongCo.tag_b] || strongCo.tag_b;
    questions.push({
      question: `${tagA} and ${tagB} tended to show up within about ${strongCo.lag_days_avg.toFixed(0)} days of each other. Do you notice these happening together?`,
      context: `${strongCo.n} co-occurrences detected`
    });
  }

  const sev = stats.severity_by_tag.find(s => !s.low_confidence && s.avg_severity >= 3);
  if (sev) {
    const label = TAG_LABELS[sev.tag] || sev.tag.replace(/_/g, ' ');
    questions.push({
      question: `Your ${label.toLowerCase()} averaged ${sev.avg_severity.toFixed(1)} out of 5 in severity. What does that look like in your daily life?`,
      context: `Average severity across ${sev.n} entries`
    });
  }

  if (stats.cycle_day_correlation && stats.cycle_day_correlation.length > 0) {
    const corr = stats.cycle_day_correlation[0];
    const label = TAG_LABELS[corr.tag] || corr.tag.replace(/_/g, ' ');
    questions.push({
      question: `There's a pattern of ${label.toLowerCase()} around cycle day ${Math.round(corr.avg_cycle_day)}. Has this always tracked with your cycle?`,
      context: `Cycle day correlation detected`
    });
  }

  if (questions.length < 3) {
    questions.push({
      question: "Is there anything you've noticed that hasn't come up in your logged entries yet?",
      context: 'General exploration'
    });
  }

  return questions.slice(0, 4);
}
