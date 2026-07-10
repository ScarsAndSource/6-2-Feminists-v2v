import { motion } from 'framer-motion';
import {
  Home, Activity, Compass, FileText, MessageCircle,
} from 'lucide-react';

type TabType = 'home' | 'log' | 'timeline' | 'casefile' | 'rehearsal' | 'insights';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  entryCount?: number;
}

const tabs: { key: TabType; label: string; Icon: typeof Home }[] = [
  { key: 'home',      label: 'Home',      Icon: Home },
  { key: 'log',       label: 'Track',     Icon: Activity },
  { key: 'timeline',  label: 'Timeline',  Icon: Compass },
  { key: 'casefile',  label: 'Case File', Icon: FileText },
  { key: 'rehearsal', label: 'Practice',  Icon: MessageCircle },
];

export function BottomNav({ activeTab, onTabChange, entryCount }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 sm:hidden"
      role="navigation"
      aria-label="Main"
    >
      {/* frosted glass backdrop */}
      <div className="absolute inset-0 bg-rose-50/70 backdrop-blur-2xl border-t border-rose-200/60" />

      <div className="relative flex items-end justify-around px-1 pb-[env(safe-area-inset-bottom,6px)] pt-1.5">
        {tabs.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 group outline-none"
              aria-current={active ? 'page' : undefined}
            >
              {/* active pill glow */}
              {active && (
                <motion.div
                  layoutId="bottomNavPill"
                  className="absolute -top-0.5 w-10 h-[3px] rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-200 ${
                    active
                      ? 'text-rose-600 scale-110'
                      : 'text-rose-400/70 group-hover:text-rose-500 group-active:scale-90'
                  }`}
                />
                {/* badge for Case File */}
                {key === 'casefile' && entryCount !== undefined && entryCount > 0 && !active && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full leading-none shadow-sm">
                    {entryCount > 99 ? '99+' : entryCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-semibold tracking-wide leading-none transition-colors duration-200 ${
                  active ? 'text-rose-700' : 'text-rose-400/80'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
