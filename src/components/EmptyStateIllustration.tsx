import { motion } from 'framer-motion';

type Variant = 'seedling' | 'dormant-bud' | 'open-journal';

function Seedling() {
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeWidth="1.6" strokeLinecap="round">
      <path d="M50 88 L50 55" stroke="currentColor" />
      <path d="M50 55 C 38 52, 30 42, 32 30 C 44 30, 52 40, 50 52" stroke="currentColor" />
      <path d="M50 60 C 62 56, 70 46, 67 34 C 55 35, 48 45, 50 58" stroke="currentColor" opacity="0.75" />
      <path d="M30 88 C 40 84, 60 84, 70 88" stroke="currentColor" opacity="0.4" />
    </svg>
  );
}

function DormantBud() {
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeWidth="1.6" strokeLinecap="round">
      <path d="M50 90 C 48 65, 52 45, 50 25" stroke="currentColor" />
      <path d="M50 25 C 44 20, 44 12, 50 6 C 56 12, 56 20, 50 25 Z" stroke="currentColor" />
      <path d="M50 40 C 42 38, 34 42, 32 50 C 40 52, 47 47, 48 40" stroke="currentColor" opacity="0.6" />
      <path d="M50 55 C 58 52, 66 55, 68 63 C 60 66, 53 61, 51 55" stroke="currentColor" opacity="0.6" />
    </svg>
  );
}

function OpenJournal() {
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeWidth="1.6" strokeLinecap="round">
      <path d="M50 24 L18 30 L18 78 L50 72 L82 78 L82 30 L50 24 Z" stroke="currentColor" />
      <path d="M50 24 L50 72" stroke="currentColor" opacity="0.5" />
      <path d="M26 40 L42 37 M26 48 L42 45 M26 56 L38 54" stroke="currentColor" opacity="0.45" strokeWidth="1.2" />
      <path d="M58 45 C 58 40, 63 37, 66 41 C 69 37, 74 40, 73 45 C 73 49, 66 53, 66 53 C 66 53, 58 49, 58 45 Z" stroke="currentColor" opacity="0.7" />
    </svg>
  );
}

const VARIANTS: Record<Variant, () => JSX.Element> = {
  seedling: Seedling,
  'dormant-bud': DormantBud,
  'open-journal': OpenJournal,
};

export function EmptyStateIllustration({ variant, className = '' }: { variant: Variant; className?: string }) {
  const Illustration = VARIANTS[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/60 border border-rose-200/50 flex items-center justify-center shadow-soft text-rose-400 p-4 float-element ${className}`}
    >
      <Illustration />
    </motion.div>
  );
}
