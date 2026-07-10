import { motion, AnimatePresence } from 'framer-motion';

const PETAL_ANGLES = [0, 72, 144, 216, 288];

function Petal({ angle, delay }: { angle: number; delay: number }) {
  return (
    <motion.g
      style={{ originX: '50%', originY: '50%' }}
      initial={{ scale: 0, opacity: 0, rotate: angle - 20 }}
      animate={{ scale: [0, 1.1, 1], opacity: 1, rotate: angle }}
      transition={{ duration: 0.7, delay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <ellipse cx="50" cy="26" rx="7" ry="16" fill="url(#petalGradient)" opacity="0.9" />
    </motion.g>
  );
}

export function PetalLoader({ messageIndex, message }: { messageIndex: number; message: string }) {
  return (
    <div className="text-center py-16">
      <div className="relative w-24 h-24 mx-auto mb-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="petalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f489b4" />
              <stop offset="100%" stopColor="#d4457f" />
            </linearGradient>
          </defs>
          <g transform="translate(50 50) translate(-50 -50)">
            {PETAL_ANGLES.map((angle, i) => (
              <Petal key={`${messageIndex}-${i}`} angle={angle} delay={i * 0.09} />
            ))}
          </g>
          <motion.circle
            cx="50"
            cy="50"
            r="8"
            fill="#b8336a"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-display font-medium text-rose-950 mb-1"
        >
          {message}
        </motion.p>
      </AnimatePresence>
      <p className="text-sm text-rose-400">This may take a few seconds</p>
    </div>
  );
}
