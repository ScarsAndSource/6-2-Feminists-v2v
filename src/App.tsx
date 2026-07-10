import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Heart, ChevronRight, Sparkles, MessageCircle, Shield, Activity,
  ArrowRight, Calendar, Lock, Eye, Feather, Star, Quote, X,
  Home as HomeIcon, Compass, Settings as SettingsIcon,
} from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { usePatternReports } from './hooks/usePatternReports';
import { useDemoEntries } from './hooks/useDemoEntries';
import { useCustomTags } from './hooks/useCustomTags';
import { useUserSettings } from './hooks/useUserSettings';
import { SymptomLogger } from './components/SymptomLogger';
import { Home } from './components/Home';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CaseFile } from './components/CaseFile';
import { EntryHistory } from './components/EntryHistory';
import { TagPromotionSuggestion } from './components/TagPromotionSuggestion';
import { AppointmentPrompt } from './components/AppointmentPrompt';
import { RehearsalMode } from './components/RehearsalMode';
import { CycleAmbientBackground } from './components/CycleAmbientBackground';
import { BotanicalLayer } from './components/BotanicalLayer';
import { ParticleField } from './components/ParticleField';
import { CycleConstellation } from './components/CycleConstellation';
import { TextReveal } from './components/TextReveal';
import { BottomNav } from './components/BottomNav';
import { Timeline } from './components/Timeline';
import { Insights } from './components/Insights';
import { Settings } from './components/Settings';
import { CaseFileHistory } from './components/CaseFileHistory';
import { getCyclePhase, themeForPhase } from './lib/cyclePhase';
import { computeStats } from './lib/aggregation';
import { hasOnboarded } from './lib/localFlags';
import type { Entry, TagEntry } from './lib/types';

type TabType = 'home' | 'log' | 'timeline' | 'casefile' | 'rehearsal' | 'insights';

function AppContent() {
  const { loading: authLoading } = useAuth();
  const { entries, loading: entriesLoading, addEntry, deleteEntry } = useEntries();
  const { saveReport, reports, loading: reportsLoading } = usePatternReports();
  const { customTags, loading: customTagsLoading } = useCustomTags();
  const { settings: userSettings, loading: settingsLoading } = useUserSettings();
  const nextAppointmentAt = userSettings?.next_appointment_at ?? null;
  const demo = useDemoEntries();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showLanding, setShowLanding] = useState(false);
  const [onboarding, setOnboarding] = useState(!hasOnboarded());
  const [demoMode, setDemoMode] = useState(false);
  const hasAutoNavigated = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusModeManual, setFocusMode] = useState(false);
  const focusMode = focusModeManual || activeTab === 'timeline' || activeTab === 'casefile';
  const [optimisticEntries, setOptimisticEntries] = useState<Entry[]>([]);
  const entrySubmitCount = useRef(0);
  const [showNudge, setShowNudge] = useState(false);
  const [viewingReport, setViewingReport] = useState<PatternReport | null>(null);

  const activeEntries = demoMode ? demo.entries : entries;
  const stats = useMemo(() => computeStats(activeEntries), [activeEntries]);

  const displayEntries = useMemo(() =>
    demoMode ? activeEntries : [...optimisticEntries, ...activeEntries],
    [activeEntries, optimisticEntries, demoMode]
  );
  const lastEntry = useMemo(() => {
    if (displayEntries.length === 0) return null;
    return [...displayEntries].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  }, [displayEntries]);
  const tagFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const e of activeEntries) {
      for (const t of e.tags) {
        freq[t.tag] = (freq[t.tag] || 0) + 1;
      }
    }
    return freq;
  }, [activeEntries]);

  const previousOtherNotes = useMemo(() => {
    const notes: string[] = [];
    for (const e of activeEntries) {
      for (const t of e.tags) {
        if (t.tag === 'other' && t.note) notes.push(t.note);
      }
    }
    return notes;
  }, [activeEntries]);

  const mostRecentCycleDay = activeEntries.length
    ? [...activeEntries].sort((a, b) => b.created_at.localeCompare(a.created_at))[0].cycle_day
    : null;
  const cyclePhase = getCyclePhase(mostRecentCycleDay);
  const phaseTheme = themeForPhase(cyclePhase);

  const enterDemo = () => {
    setDemoMode(true);
    setShowLanding(false);
    setActiveTab('casefile');
    demo.fetchDemoEntries();
  };

  const exitDemo = () => {
    setDemoMode(false);
    setActiveTab('home');
  };

  const handleAddEntry = async (tags: TagEntry[], cycleDay?: number) => {
    entrySubmitCount.current += 1;
    if (entrySubmitCount.current > 0 && entrySubmitCount.current % 5 === 0) {
      setShowNudge(true);
    }
    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const optimisticEntry: Entry = {
      id: optimisticId,
      user_id: 'optimistic',
      tags,
      cycle_day: cycleDay ?? null,
      created_at: new Date().toISOString(),
    };
    setOptimisticEntries(prev => [optimisticEntry, ...prev]);
    try {
      const realEntry = await addEntry(tags, cycleDay);
      setOptimisticEntries(prev => prev.filter(e => e.id !== optimisticId));
      return realEntry;
    } catch (e) {
      setOptimisticEntries(prev => prev.filter(e => e.id !== optimisticId));
      throw e;
    }
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

  if ((authLoading || entriesLoading || customTagsLoading || settingsLoading) && entries.length === 0 && !demoMode) {
    return <LoadingScreen />;
  }

  if (onboarding && !authLoading) {
    return <OnboardingFlow onComplete={() => setOnboarding(false)} />;
  }

  if (onboarding) {
    return <LoadingScreen />;
  }

  if (showLanding) {
    return (
      <>
        <CycleAmbientBackground phase={cyclePhase} />
        <BotanicalLayer tint={phaseTheme.accent} />
        <LandingPage
          onStart={() => setShowLanding(false)}
          onViewSample={enterDemo}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col no-print relative bg-rose-50">
      <CycleAmbientBackground phase={cyclePhase} focusMode={focusMode} />
      <BotanicalLayer tint={phaseTheme.accent} focusMode={focusMode} />
      <ParticleField count={14} focusMode={focusMode} />

      <header className="sticky top-0 z-50 glass border-b border-rose-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowLanding(true)}
              className="group flex items-center gap-2.5"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft transition-all group-hover:scale-110 group-hover:rotate-6">
                  <Heart className="w-5 h-5 text-white heartbeat" fill="white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-300 border-2 border-rose-100 twinkle" />
              </div>
              <span className="font-display font-semibold text-rose-800 tracking-tight hidden sm:block text-lg">
                HerWellness
              </span>
            </button>

            <nav className="flex items-center">
              <div className="flex items-center bg-rose-100/70 rounded-2xl p-1 border border-rose-200/50">
                <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<HomeIcon className="w-4 h-4" />}>Home</TabButton>
                <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')} icon={<Activity className="w-4 h-4" />}>Track</TabButton>
                <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<Compass className="w-4 h-4" />}>Timeline</TabButton>
                <TabButton active={activeTab === 'casefile'} onClick={() => setActiveTab('casefile')} icon={<FileText className="w-4 h-4" />} badge={activeEntries.length > 0 ? activeEntries.length : undefined}>Case File</TabButton>
                <TabButton active={activeTab === 'rehearsal'} onClick={() => setActiveTab('rehearsal')} icon={<MessageCircle className="w-4 h-4" />}>Practice</TabButton>
              </div>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-200/50 text-rose-400 hover:text-rose-600 transition-all active:scale-90"
                aria-label="Settings"
              >
                <SettingsIcon className="w-[18px] h-[18px]" />
              </button>
              <div className="flex items-center gap-2 opacity-70">
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse-soft" />
                <span className="text-xs text-rose-400 hidden sm:block font-medium">{demoMode ? 'Sample' : 'Synced'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {demoMode && (
        <div className="bg-rose-500/10 border-b border-rose-200/50 px-4 py-2 relative z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-rose-600">
              <Sparkles className="w-4 h-4" />
              <span>You're viewing sample data. Nothing here is saved to your account.</span>
            </div>
            <button
              onClick={exitDemo}
              className="flex items-center gap-1.5 text-rose-500 hover:text-rose-700 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
              Exit sample
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24 sm:pb-6 relative z-10">
        {activeTab === 'home' && !demoMode && (
          <Home
            entries={displayEntries}
            stats={stats}
            tagFrequency={tagFrequency}
            addEntry={handleAddEntry}
            deleteEntry={deleteEntry}
            onNavigate={(tab) => setActiveTab(tab)}
            loading={entriesLoading}
          />
        )}

        {activeTab === 'timeline' && !demoMode && (
          <Timeline entries={displayEntries} onDelete={deleteEntry} loading={entriesLoading} />
        )}

        {activeTab === 'insights' && !demoMode && (
          <Insights entries={displayEntries} stats={stats} />
        )}

        {activeTab === 'log' && !demoMode && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fade-in">
            <div className="lg:col-span-3">
              <TagPromotionSuggestion entries={activeEntries} />
              <AppointmentPrompt />
              {showNudge && (
                <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-200/50 rounded-xl text-sm animate-fade-in">
                  <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-rose-600 flex-1">
                    {entries.length} entries logged — your Case File just got richer
                  </span>
                  <button
                    onClick={() => setActiveTab('casefile')}
                    className="text-rose-500 hover:text-rose-700 font-semibold transition-colors shrink-0"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setShowNudge(false)}
                    className="text-rose-400 hover:text-rose-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="gradient-border-animated">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-rose-800 mb-1">
                        <TextReveal text="How are you feeling today?" delay={100} staggerMs={30} />
                      </h2>
                      <p className="text-sm text-rose-500 text-slide-left" style={{ animationDelay: '300ms', opacity: 0 }}>
                        Select symptoms, adjust severity, and log your experience
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CycleConstellation entries={activeEntries} size={64} />
                      <div className="text-right">
                        <div className="text-4xl font-bold font-display gradient-text number-transition">{entries.length}</div>
                        <div className="text-sm text-rose-400 uppercase tracking-wide font-medium">entries</div>
                      </div>
                    </div>
                  </div>
                  <SymptomLogger
                    onSubmit={handleAddEntry}
                    onDelete={deleteEntry}
                    disabled={entriesLoading}
                    customTags={customTags}
                    onFocusChange={setFocusMode}
                    lastEntry={lastEntry}
                    tagFrequency={tagFrequency}
                    previousOtherNotes={previousOtherNotes}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <EntryHistory entries={displayEntries} onDelete={deleteEntry} loading={entriesLoading} />
            </div>
          </div>
        )}

        {activeTab === 'casefile' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-rose-800 mb-1">
                  <TextReveal text={demoMode ? 'Sample Case File' : 'Your Case File'} delay={100} />
                </h2>
                <p className="text-sm text-rose-500 text-slide-left" style={{ animationDelay: '200ms', opacity: 0 }}>
                  A clinical summary ready for your next appointment
                </p>
              </div>
              {activeEntries.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-rose-400">
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

            {!demoMode && !viewingReport && (
              <div className="mb-6">
                <CaseFileHistory
                  reports={reports}
                  loading={reportsLoading}
                  onSelect={(report) => setViewingReport(report)}
                />
              </div>
            )}

            {demoMode && demo.loading && (
              <div className="text-center py-16 text-rose-500 text-sm">Loading sample data...</div>
            )}
            {demoMode && demo.error && (
              <div className="text-center py-16 text-red-400 text-sm">{demo.error}</div>
            )}

            {(!demoMode || demo.loaded) && (
              <div className="print-area">
                <ErrorBoundary fallbackLabel="Something went wrong displaying this Case File">
                  <CaseFile 
                    entries={activeEntries} 
                    onGenerated={demoMode ? undefined : saveReport} 
                    isDemo={demoMode} 
                    initialReport={viewingReport}
                    onClearInitial={() => setViewingReport(null)}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rehearsal' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold text-rose-800 mb-1">
                <TextReveal text="Practice Mode" delay={100} />
              </h2>
              <p className="text-sm text-rose-500 text-slide-left" style={{ animationDelay: '200ms', opacity: 0 }}>
                Rehearse explaining your symptoms with personalized questions
              </p>
            </div>
            <RehearsalMode stats={stats} isDemo={demoMode} />
          </div>
        )}
      </main>

      <footer className="border-t border-rose-200 py-4 px-6 relative z-10 hidden sm:block">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 text-sm text-rose-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Anonymous by design. Only aggregated stats reach the AI.</span>
          </div>
          {activeEntries.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{activeEntries.length} logged</span>
            </div>
          )}
        </div>
      </footer>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} entryCount={activeEntries.length > 0 ? activeEntries.length : undefined} />

      <Settings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        reports={reports}
        reportsLoading={reportsLoading}
        onShowLanding={() => setShowLanding(true)}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-rose-50">
      <CycleAmbientBackground phase={null} />
      <BotanicalLayer tint="#e8679b" />
      <div className="text-center relative z-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow animate-pulse-soft">
          <Heart className="w-10 h-10 text-white heartbeat" fill="white" />
        </div>
        <div className="flex items-center gap-1.5 text-rose-400 justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="mt-4 text-sm text-rose-500 font-medium text-blur-in" style={{ animationDelay: '400ms' }}>
          Loading your wellness space...
        </p>
      </div>
    </div>
  );
}

function LandingPage({ onStart, onViewSample }: { onStart: () => void; onViewSample: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-rose-50">
      <ParticleField count={22} />

      <nav className="fixed top-0 left-0 right-0 z-50 glass-subtle border-b border-rose-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft">
              <Heart className="w-5 h-5 text-white heartbeat" fill="white" />
            </div>
            <span className="font-display font-semibold text-rose-800 tracking-tight text-lg text-blur-in" style={{ animationDelay: '200ms' }}>
              HerWellness
            </span>
          </div>

          <button
            onClick={onStart}
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-full font-semibold text-sm hover:from-rose-400 hover:to-rose-500 transition-all hover:scale-105 shadow-glow-soft fade-scale"
            style={{ animationDelay: '300ms', opacity: 0 }}
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      <section className="pt-36 pb-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100/70 border border-rose-200/50 text-sm text-rose-700 mb-6 backdrop-blur-sm fade-scale" style={{ animationDelay: '400ms', opacity: 0 }}>
            <Sparkles className="w-4 h-4 text-rose-500 twinkle" />
            <span className="font-medium">Built for the moments when you need to be heard</span>
          </div>

          <p
            className="font-script text-3xl text-rose-400 mb-2 leading-none text-blur-in"
            style={{ animationDelay: '450ms' }}
          >
            you don't have to fight to be believed
          </p>

          <h1 className="relative font-display text-5xl sm:text-6xl lg:text-7xl font-normal text-rose-950 mb-6 leading-[1.1] tracking-tight">
            <span className="absolute -top-6 -right-4 sm:-right-10 w-16 h-16 sm:w-20 sm:h-20 text-rose-300/50 float-element-slow pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 90 90" fill="none" strokeWidth="1.3" strokeLinecap="round">
                <circle cx="45" cy="45" r="7" stroke="currentColor" />
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const x1 = 45 + Math.cos(angle) * 10;
                  const y1 = 45 + Math.sin(angle) * 10;
                  const x2 = 45 + Math.cos(angle) * 24;
                  const y2 = 45 + Math.sin(angle) * 24;
                  const cx = 45 + Math.cos(angle + 0.25) * 17;
                  const cy = 45 + Math.sin(angle + 0.25) * 17;
                  return <path key={i} d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`} stroke="currentColor" opacity="0.8" />;
                })}
              </svg>
            </span>
            <TextReveal text="Your symptoms," delay={500} staggerMs={60} />
            <br />
            <span className="gradient-text animate-gradient-text text-blur-in" style={{ animationDelay: '800ms' }}>
              finally visible.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-rose-500 mb-10 max-w-2xl mx-auto leading-relaxed text-blur-in" style={{ animationDelay: '1000ms' }}>
            We can't change how a doctor listens. We make sure what you bring them
            can't be waved off as memory, anecdote, or stress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 fade-scale" style={{ animationDelay: '1200ms', opacity: 0 }}>
            <button
              onClick={onStart}
              className="group w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-semibold rounded-full transition-all shadow-glow hover:shadow-lg hover:scale-[1.03] flex items-center justify-center gap-2 glow-pulse"
            >
              Start Tracking Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onViewSample}
              className="group w-full sm:w-auto px-7 py-4 bg-rose-100/70 hover:bg-rose-200 text-rose-700 font-medium rounded-full transition-all border border-rose-200/60 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-card"
            >
              <FileText className="w-5 h-5 text-rose-400 group-hover:sway" />
              View Sample Case File
            </button>
          </div>

          <div className="relative max-w-xl mx-auto fade-scale" style={{ animationDelay: '1400ms', opacity: 0 }}>
            <div className="absolute -inset-3 bg-gradient-to-r from-rose-500/20 via-rose-400/15 to-rose-500/20 rounded-3xl blur-2xl opacity-60 bloom" />
            <div className="relative bg-white/80 backdrop-blur-md rounded-3xl p-7 border border-rose-200/50 shadow-card shimmer-overlay">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center shadow-soft">
                  <FileText className="w-6 h-6 text-rose-400 sway" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display font-semibold text-rose-900 mb-0.5">Case File Preview</h3>
                  <p className="text-xs text-rose-500">Generated from 24 symptom entries over 6 weeks</p>
                </div>
              </div>
              <div className="space-y-2 text-left text-sm text-rose-700 leading-relaxed">
                <p>
                  <TextReveal text="Bloating was logged 12 times across your tracking period, more than any other symptom." delay={1600} staggerMs={25} />
                </p>
                <p className="text-xs text-rose-400 border-t border-rose-200 pt-2 mt-2 flex items-center gap-1.5">
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
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-rose-800 mb-3 text-blur-in">
              Everything you need for your next appointment
            </h2>
            <p className="text-rose-500 text-lg text-slide-left" style={{ animationDelay: '200ms', opacity: 0 }}>
              Three tools designed to make your voice heard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Activity className="w-6 h-6" />}
              title="Track Symptoms"
              description="Quick logging with severity levels. Optional cycle tracking for patterns. Voice input for when typing is hard."
              gradient="from-rose-400 to-rose-600"
              delay={0}
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI Narrative"
              description="Turn raw entries into a clinical summary. Evidence-based, citation-ready, ready to print or share."
              gradient="from-rose-500 to-rose-600"
              delay={120}
            />
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title="Practice Mode"
              description="Rehearse your appointment with personalized questions. Walk in prepared, walk out heard."
              gradient="from-rose-600 to-rose-700"
              delay={240}
            />
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <Quote className="w-12 h-12 text-rose-300 mx-auto mb-4 sway" />
            <blockquote className="font-display text-2xl sm:text-3xl text-rose-700 font-medium leading-relaxed italic mb-4 text-blur-in">
              "I walked in with three pages of data. For the first time, my doctor
              didn't say 'let's wait and see.' She said 'let's look at this together.'"
            </blockquote>
            <div className="flex items-center justify-center gap-1 text-rose-400 fade-scale" style={{ animationDelay: '300ms', opacity: 0 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-rose-400 text-rose-400 twinkle" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            <p className="mt-3 text-sm text-rose-400 text-slide-left" style={{ animationDelay: '400ms', opacity: 0 }}>— A HerWellness user</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-100/80 border border-rose-200/50 mb-6 shadow-card backdrop-blur-sm">
            <Shield className="w-8 h-8 text-rose-400 bloom" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-rose-800 mb-3 text-blur-in">Privacy by Design</h3>
          <p className="text-rose-500 mb-8 max-w-xl mx-auto leading-relaxed text-blur-in" style={{ animationDelay: '100ms' }}>
            Your raw entries never leave this session. Only anonymized statistical
            summaries are sent to the AI model that writes your narrative. Nothing is sold or shared.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-rose-500">
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-100/60 rounded-full border border-rose-200/40 backdrop-blur-sm hover-scale">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Anonymous auth</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-100/60 rounded-full border border-rose-200/40 backdrop-blur-sm hover-scale">
              <Eye className="w-4 h-4 text-rose-400" />
              <span>Zero personal data</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-100/60 rounded-full border border-rose-200/40 backdrop-blur-sm hover-scale">
              <Feather className="w-4 h-4 text-rose-400" />
              <span>Data stays encrypted</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 sm:px-6 border-t border-rose-200 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-rose-400 leading-relaxed">
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
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-300 z-10 ${
        active ? 'text-white' : 'text-rose-400 hover:text-rose-700'
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTabPill"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl shadow-glow-soft"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      {!active && (
        <div className="absolute inset-0 -z-10 rounded-xl hover:bg-rose-200/40 transition-colors" />
      )}
      {icon}
      <span className="hidden sm:inline">{children}</span>
      {badge !== undefined && (
        <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold transition-all ${
          active
            ? 'bg-white text-rose-600'
            : 'bg-rose-500 text-white'
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
      className="group bg-rose-100/60 backdrop-blur-sm border border-rose-200/50 rounded-3xl p-7 hover:border-rose-300/60 transition-all duration-300 hover:translate-y-[-6px] hover:shadow-card rise-fade shimmer-overlay"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-5 shadow-glow-soft group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-rose-800 mb-2 text-lg text-slide-left" style={{ animationDelay: `${delay + 100}ms`, opacity: 0 }}>{title}</h3>
      <p className="text-sm text-rose-500 leading-relaxed text-slide-left" style={{ animationDelay: `${delay + 200}ms`, opacity: 0 }}>{description}</p>
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
