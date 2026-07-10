import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Heart,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Shield,
  Activity,
  ArrowRight,
  Calendar,
  Lock,
  Eye,
  Feather,
  Star,
  Quote,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { usePatternReports } from './hooks/usePatternReports';
import { useDemoEntries } from './hooks/useDemoEntries';
import { useCustomTags } from './hooks/useCustomTags';
import { useUserSettings } from './hooks/useUserSettings';
import { SymptomLogger } from './components/SymptomLogger';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CaseFile } from './components/CaseFile';
import { EntryHistory } from './components/EntryHistory';
import { TagPromotionSuggestion } from './components/TagPromotionSuggestion';
import { AppointmentPrompt } from './components/AppointmentPrompt';
import { RehearsalMode } from './components/RehearsalMode';
import { ShaderBackground } from './components/ShaderBackground';
import { ParticleField } from './components/ParticleField';
import { computeStats } from './lib/aggregation';

type TabType = 'log' | 'casefile' | 'rehearsal';

function TextReveal({
  text,
  className = '',
  delay = 0,
  staggerMs = 40,
}: {
  text: string;
  className?: string;
  delay?: number;
  staggerMs?: number;
}) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="text-reveal-word"
          style={{ animationDelay: `${delay + i * staggerMs}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
}

function AppContent() {
  const { loading: authLoading } = useAuth();
  const { entries, loading: entriesLoading, addEntry, deleteEntry } = useEntries();
  const { saveReport } = usePatternReports();
  const { customTags, addCustomTag, loading: customTagsLoading } = useCustomTags();
  const { nextAppointmentAt, setNextAppointment, loading: settingsLoading } = useUserSettings();
  const demo = useDemoEntries();
  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [showLanding, setShowLanding] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const hasAutoNavigated = useRef(false);
  const [promoteSuggestion, setPromoteSuggestion] = useState<string | null>(null);

  const activeEntries = demoMode ? demo.entries : entries;
  const stats = useMemo(() => computeStats(activeEntries), [activeEntries]);

  const enterDemo = () => {
    setDemoMode(true);
    setShowLanding(false);
    setActiveTab('casefile');
    demo.fetchDemoEntries();
  };

  const exitDemo = () => {
    setDemoMode(false);
    setActiveTab('log');
  };

  useEffect(() => {
    if (nextAppointmentAt && !hasAutoNavigated.current) {
      const now = Date.now();
      const apptTime = new Date(nextAppointmentAt).getTime();
      const diffMs = apptTime - now;
      const fortyEightHoursMs = 48 * 60 * 60 * 1000;
      if (diffMs > 0 && diffMs <= fortyEightHoursMs) {
        hasAutoNavigated.current = true;
        setActiveTab('casefile');
      }
    }
  }, [nextAppointmentAt]);

  const handlePromote = async (label: string) => {
    await addCustomTag(label);
    setPromoteSuggestion(null);
  };

  if ((authLoading || entriesLoading || customTagsLoading || settingsLoading) && entries.length === 0 && !demoMode) {
    return <LoadingScreen />;
  }

  if (showLanding) {
    return (
      <>
        <ShaderBackground />
        <LandingPage
          onStart={() => setShowLanding(false)}
          onViewSample={enterDemo}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col no-print relative bg-slate-950">
      <ShaderBackground />
      <ParticleField count={14} />

      <header className="sticky top-0 z-50 glass border-b border-teal-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowLanding(true)}
              className="group flex items-center gap-2.5"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-glow-soft transition-all group-hover:scale-110 group-hover:rotate-6">
                  <Heart className="w-5 h-5 text-white heartbeat" fill="white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 twinkle" />
              </div>
              <span className="font-display font-semibold text-white tracking-tight hidden sm:block text-lg">
                HerWellness
              </span>
            </button>

            <nav className="flex items-center">
              <div className="flex items-center bg-slate-800/50 rounded-2xl p-1 border border-slate-700/50">
                <TabButton
                  active={activeTab === 'log'}
                  onClick={() => setActiveTab('log')}
                  icon={<Activity className="w-4 h-4" />}
                >
                  Track
                </TabButton>
                <TabButton
                  active={activeTab === 'casefile'}
                  onClick={() => setActiveTab('casefile')}
                  icon={<FileText className="w-4 h-4" />}
                  badge={activeEntries.length > 0 ? activeEntries.length : undefined}
                >
                  Case File
                </TabButton>
                <TabButton
                  active={activeTab === 'rehearsal'}
                  onClick={() => setActiveTab('rehearsal')}
                  icon={<MessageCircle className="w-4 h-4" />}
                >
                  Practice
                </TabButton>
              </div>
            </nav>

            <div className="flex items-center gap-2 opacity-70">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse-soft" />
              <span className="text-xs text-teal-400 hidden sm:block font-medium">{demoMode ? 'Sample' : 'Synced'}</span>
            </div>
          </div>
        </div>
      </header>

      {demoMode && (
        <div className="bg-teal-500/10 border-b border-teal-500/20 px-4 py-2 relative z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-teal-300">
              <Sparkles className="w-4 h-4" />
              <span>You're viewing sample data. Nothing here is saved to your account.</span>
            </div>
            <button
              onClick={exitDemo}
              className="flex items-center gap-1.5 text-teal-400 hover:text-teal-200 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
              Exit sample
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 relative z-10">
        {activeTab === 'log' && !demoMode && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fade-in">
            <div className="lg:col-span-3">
              {promoteSuggestion && (
                <TagPromotionSuggestion
                  label={promoteSuggestion}
                  onPromote={handlePromote}
                  onDismiss={() => setPromoteSuggestion(null)}
                />
              )}
              <AppointmentPrompt
                nextAppointmentAt={nextAppointmentAt}
                onSet={setNextAppointment}
              />
              <div className="gradient-border-animated">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-white mb-1">
                        <TextReveal text="How are you feeling today?" delay={100} staggerMs={30} />
                      </h2>
                      <p className="text-sm text-slate-400 text-slide-left" style={{ animationDelay: '300ms', opacity: 0 }}>
                        Select symptoms, adjust severity, and log your experience
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold font-display gradient-text number-transition">{entries.length}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">entries</div>
                    </div>
                  </div>
                  <SymptomLogger
                    onSubmit={addEntry}
                    onDelete={deleteEntry}
                    disabled={entriesLoading}
                    customTags={customTags}
                    onPromoteSuggestion={setPromoteSuggestion}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <EntryHistory entries={entries} onDelete={deleteEntry} loading={entriesLoading} />
            </div>
          </div>
        )}

        {activeTab === 'casefile' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-white mb-1">
                  <TextReveal text={demoMode ? 'Sample Case File' : 'Your Case File'} delay={100} />
                </h2>
                <p className="text-sm text-slate-400 text-slide-left" style={{ animationDelay: '200ms', opacity: 0 }}>
                  A clinical summary ready for your next appointment
                </p>
              </div>
              {activeEntries.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {Math.ceil(
                        (Date.now() - new Date(activeEntries[activeEntries.length - 1].created_at).getTime()) /
                          (1000 * 60 * 60 * 24 * 7)
                      )} weeks tracked
                    </span>
                  </div>
                </div>
              )}
            </div>

            {demoMode && demo.loading && (
              <div className="text-center py-16 text-slate-400 text-sm">Loading sample data...</div>
            )}
            {demoMode && demo.error && (
              <div className="text-center py-16 text-red-400 text-sm">{demo.error}</div>
            )}

            {(!demoMode || demo.loaded) && (
              <div className="print-area">
                <ErrorBoundary fallbackLabel="Something went wrong displaying this Case File">
                  <CaseFile entries={activeEntries} onGenerated={demoMode ? undefined : saveReport} isDemo={demoMode} />
                </ErrorBoundary>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rehearsal' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-white mb-1">
                <TextReveal text="Practice Mode" delay={100} />
              </h2>
              <p className="text-sm text-slate-400 text-slide-left" style={{ animationDelay: '200ms', opacity: 0 }}>
                Rehearse explaining your symptoms with personalized questions
              </p>
            </div>
            <RehearsalMode stats={stats} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Anonymous by design. Only aggregated stats reach the AI.</span>
          </div>
          {activeEntries.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>{activeEntries.length} logged</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-slate-950">
      <ShaderBackground />
      <div className="text-center relative z-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-glow animate-pulse-soft">
          <Heart className="w-10 h-10 text-white heartbeat" fill="white" />
        </div>
        <div className="flex items-center gap-1.5 text-teal-400 justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="mt-4 text-sm text-slate-400 font-medium text-blur-in" style={{ animationDelay: '400ms' }}>
          Loading your wellness space...
        </p>
      </div>
    </div>
  );
}

function LandingPage({ onStart, onViewSample }: { onStart: () => void; onViewSample: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <ParticleField count={22} />

      <nav className="fixed top-0 left-0 right-0 z-50 glass-subtle border-b border-teal-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-glow-soft">
              <Heart className="w-5 h-5 text-white heartbeat" fill="white" />
            </div>
            <span className="font-display font-semibold text-white tracking-tight text-lg text-blur-in" style={{ animationDelay: '200ms' }}>
              HerWellness
            </span>
          </div>

          <button
            onClick={onStart}
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full font-semibold text-sm hover:from-teal-400 hover:to-teal-500 transition-all hover:scale-105 shadow-glow-soft fade-scale"
            style={{ animationDelay: '300ms', opacity: 0 }}
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      <section className="pt-36 pb-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-sm text-teal-300 mb-8 backdrop-blur-sm fade-scale" style={{ animationDelay: '400ms', opacity: 0 }}>
            <Sparkles className="w-4 h-4 text-teal-400 twinkle" />
            <span className="font-medium">Built for the moments when you need to be heard</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
            <TextReveal text="Your symptoms," delay={500} staggerMs={60} />
            <br />
            <span className="gradient-text animate-gradient-text text-blur-in" style={{ animationDelay: '800ms' }}>
              finally visible.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed text-blur-in" style={{ animationDelay: '1000ms' }}>
            We can't change how a doctor listens. We make sure what you bring them
            can't be waved off as memory, anecdote, or stress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 fade-scale" style={{ animationDelay: '1200ms', opacity: 0 }}>
            <button
              onClick={onStart}
              className="group w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold rounded-full transition-all shadow-glow hover:shadow-lg hover:scale-[1.03] flex items-center justify-center gap-2 glow-pulse"
            >
              Start Tracking Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onViewSample}
              className="group w-full sm:w-auto px-7 py-4 bg-slate-800/70 hover:bg-slate-700 text-slate-200 font-medium rounded-full transition-all border border-slate-700/60 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-card"
            >
              <FileText className="w-5 h-5 text-teal-400 group-hover:sway" />
              View Sample Case File
            </button>
          </div>

          <div className="relative max-w-xl mx-auto fade-scale" style={{ animationDelay: '1400ms', opacity: 0 }}>
            <div className="absolute -inset-3 bg-gradient-to-r from-teal-500/20 via-emerald-500/15 to-teal-500/20 rounded-3xl blur-2xl opacity-60 bloom" />
            <div className="relative bg-slate-800/80 backdrop-blur-md rounded-3xl p-7 border border-slate-700/50 shadow-card shimmer-overlay">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center shadow-soft">
                  <FileText className="w-6 h-6 text-teal-400 sway" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display font-semibold text-white mb-0.5">Case File Preview</h3>
                  <p className="text-xs text-slate-400">Generated from 24 symptom entries over 6 weeks</p>
                </div>
              </div>
              <div className="space-y-2 text-left text-sm text-slate-300 leading-relaxed">
                <p>
                  <TextReveal text="Bloating was logged 12 times across your tracking period, more than any other symptom." delay={1600} staggerMs={25} />
                </p>
                <p className="text-xs text-slate-500 border-t border-slate-700 pt-2 mt-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 twinkle" />
                  Based on your logged data. Not a diagnosis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 text-blur-in">
              Everything you need for your next appointment
            </h2>
            <p className="text-slate-400 text-lg text-slide-left" style={{ animationDelay: '200ms', opacity: 0 }}>
              Three tools designed to make your voice heard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Activity className="w-6 h-6" />}
              title="Track Symptoms"
              description="Quick logging with severity levels. Optional cycle tracking for patterns. Voice input for when typing is hard."
              gradient="from-teal-400 to-teal-600"
              delay={0}
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI Narrative"
              description="Turn raw entries into a clinical summary. Evidence-based, citation-ready, ready to print or share."
              gradient="from-emerald-500 to-emerald-600"
              delay={120}
            />
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title="Practice Mode"
              description="Rehearse your appointment with personalized questions. Walk in prepared, walk out heard."
              gradient="from-teal-600 to-teal-700"
              delay={240}
            />
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <Quote className="w-12 h-12 text-slate-700 mx-auto mb-4 sway" />
            <blockquote className="font-display text-2xl sm:text-3xl text-slate-200 font-medium leading-relaxed italic mb-4 text-blur-in">
              "I walked in with three pages of data. For the first time, my doctor
              didn't say 'let's wait and see.' She said 'let's look at this together.'"
            </blockquote>
            <div className="flex items-center justify-center gap-1 text-teal-500 fade-scale" style={{ animationDelay: '300ms', opacity: 0 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-teal-500 text-teal-500 twinkle" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500 text-slide-left" style={{ animationDelay: '400ms', opacity: 0 }}>— A HerWellness user</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/50 mb-6 shadow-card backdrop-blur-sm">
            <Shield className="w-8 h-8 text-teal-400 bloom" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-white mb-3 text-blur-in">Privacy by Design</h3>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed text-blur-in" style={{ animationDelay: '100ms' }}>
            Your raw entries never leave this session. Only anonymized statistical
            summaries are sent to the AI model that writes your narrative. Nothing is sold or shared.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-full border border-slate-700/40 backdrop-blur-sm hover-scale">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Anonymous auth</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-full border border-slate-700/40 backdrop-blur-sm hover-scale">
              <Eye className="w-4 h-4 text-teal-400" />
              <span>Zero personal data</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-full border border-slate-700/40 backdrop-blur-sm hover-scale">
              <Feather className="w-4 h-4 text-teal-400" />
              <span>Data stays encrypted</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 sm:px-6 border-t border-slate-800 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-slate-600 leading-relaxed">
            HerWellness is a symptom documentation tool. It does not diagnose, treat, or replace medical advice.
            Always consult a healthcare provider for medical decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
  badge
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-glow-soft scale-105'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
      {badge !== undefined && (
        <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold transition-all ${
          active
            ? 'bg-white text-teal-600'
            : 'bg-teal-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
  delay = 0
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <div
      className="group bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-7 hover:border-slate-600/60 transition-all duration-300 hover:translate-y-[-6px] hover:shadow-card rise-fade shimmer-overlay"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-5 shadow-glow-soft group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-white mb-2 text-lg text-slide-left" style={{ animationDelay: `${delay + 100}ms`, opacity: 0 }}>{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed text-slide-left" style={{ animationDelay: `${delay + 200}ms`, opacity: 0 }}>{description}</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
