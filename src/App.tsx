import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText, Heart, Sparkles, MessageCircle, Shield, Activity,
  Calendar, X,
  Home as HomeIcon, Compass, Settings as SettingsIcon,
} from 'lucide-react';
import { AuthProvider } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { usePatternReports } from './hooks/usePatternReports';
import { useDemoEntries } from './hooks/useDemoEntries';
import { useCustomTags } from './hooks/useCustomTags';
import { useUserSettings } from './hooks/useUserSettings';
import { SymptomLogger } from './components/SymptomLogger';
import { Home } from './components/Home';
import { OnboardingFlow } from './components/OnboardingFlow';
import { LandingPage } from './components/LandingPage';
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
import type { Entry, TagEntry, PatternReport } from './lib/types';

type TabType = 'home' | 'log' | 'timeline' | 'casefile' | 'rehearsal' | 'insights';

function AppContent() {
  const { entries, addEntry, deleteEntry } = useEntries();
  const { saveReport, reports, loading: reportsLoading } = usePatternReports();
  const { customTags } = useCustomTags();
  const { settings: userSettings } = useUserSettings();
  const nextAppointmentAt = userSettings?.next_appointment_at ?? null;

  // Demo mode: purely a cold-open safety net for unsupervised judges.
  // It does NOT affect real user data at all — real entries are always
  // fetched from Supabase with the user's own auth.uid().
  const demo = useDemoEntries();
  const [demoMode, setDemoMode] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showLanding, setShowLanding] = useState(false);
  const [onboarding, setOnboarding] = useState(!hasOnboarded());
  const hasAutoNavigated = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusModeManual, setFocusMode] = useState(false);
  const focusMode = focusModeManual || activeTab === 'timeline' || activeTab === 'casefile';
  const [optimisticEntries, setOptimisticEntries] = useState<Entry[]>([]);
  const entrySubmitCount = useRef(0);
  const [showNudge, setShowNudge] = useState(false);
  const [viewingReport, setViewingReport] = useState<PatternReport | null>(null);

  // In demo mode, show the seeded entries; otherwise always use the real user's data.
  const activeEntries = demoMode ? demo.entries : entries;
  const stats = useMemo(() => computeStats(activeEntries), [activeEntries]);

  // Optimistic entries are only layered on top of real data — never in demo mode.
  const displayEntries = useMemo(
    () => (demoMode ? activeEntries : [...optimisticEntries, ...activeEntries]),
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

  // Enter demo: cold-open safety net only. Judges who land on the URL
  // unsupervised see seeded data instead of an empty screen.
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

  // Auth is removed — localStorage hooks resolve instantly (loading=false).
  // The LoadingScreen component is intentionally kept for the demo flow.
  if (onboarding) {
    return <OnboardingFlow onComplete={() => setOnboarding(false)} />;
  }

  if (showLanding) {
    return (
      <LandingPage
        onStart={() => setShowLanding(false)}
        onViewSample={enterDemo}
      />
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
                <span className="text-xs text-rose-400 hidden sm:block font-medium">
                  {demoMode ? 'Sample' : 'Local'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Demo mode banner — only shows in demo mode, never during live use */}
      {demoMode && (
        <div className="bg-rose-500/10 border-b border-rose-200/50 px-4 py-2 relative z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-rose-600">
              <Sparkles className="w-4 h-4" />
              <span>Viewing sample data — nothing here is saved to your account.</span>
            </div>
            <button
              onClick={exitDemo}
              className="flex items-center gap-1.5 text-rose-500 hover:text-rose-700 transition-colors shrink-0 font-medium"
            >
              <X className="w-4 h-4" />
              Start tracking
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
            loading={false}
          />
        )}

        {activeTab === 'timeline' && !demoMode && (
          <Timeline entries={displayEntries} onDelete={deleteEntry} loading={false} />
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
                    disabled={false}
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
              <EntryHistory entries={displayEntries} onDelete={deleteEntry} loading={false} />
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
            {/* AdvocacyCoach (Round Two) is mounted inside RehearsalMode.
                isDemo suppresses it in demo mode — the coach is powered by
                real follow-up ledger records which don't exist in demo data. */}
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

export function LoadingScreen() {
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
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-white text-rose-800 shadow-soft'
          : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50/60'
      }`}
    >
      {icon}
      <span className="hidden sm:block">{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
