import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, X } from 'lucide-react';
import { celebrateAssignment } from '@/lib/confetti';

interface PerfectDaySplashProps {
  open: boolean;
  streak: number;
  childName: string;
  onClose: () => void;
}

function streakMessage(streak: number): { title: string; sub: string; emoji: string } {
  if (streak >= 30) return { title: 'Otroligt!', sub: `${streak} perfekta dagar i rad – legendarisk!`, emoji: '🏆' };
  if (streak >= 14) return { title: 'Sjukt grymt!', sub: `${streak} dagar i rad – du är ostoppbar!`, emoji: '🚀' };
  if (streak >= 7) return { title: 'En hel vecka!', sub: `${streak} dagar i rad – fantastiskt!`, emoji: '🔥' };
  if (streak >= 3) return { title: 'På rull!', sub: `${streak} dagar i rad – fortsätt så!`, emoji: '💪' };
  if (streak === 2) return { title: 'Snyggt!', sub: '2 dagar i rad – håll i!', emoji: '✨' };
  return { title: 'Allt klart!', sub: 'Dagens uppgifter är avbockade!', emoji: '🎉' };
}

export function PerfectDaySplash({ open, streak, childName, onClose }: PerfectDaySplashProps) {
  useEffect(() => {
    if (!open) return;
    celebrateAssignment();
    const t = setTimeout(onClose, 5500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  const { title, sub, emoji } = streakMessage(streak);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-card/80 flex items-center justify-center shadow-card"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>

          <motion.div
            initial={{ scale: 0.6, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl p-8 text-center bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground shadow-2xl overflow-hidden"
          >
            {/* Floating sparkle background */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: `${(i * 37) % 100}%`,
                    top: `${(i * 53) % 100}%`,
                  }}
                  animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 + (i % 3), delay: i * 0.15 }}
                >
                  ✨
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: [0, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, times: [0, 0.6, 1] }}
              className="text-7xl mb-4"
            >
              {emoji}
            </motion.div>

            <h2 className="text-3xl font-extrabold mb-1">{title}</h2>
            <p className="text-base opacity-90 mb-6">
              {childName}, {sub.toLowerCase()}
            </p>

            {streak >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 backdrop-blur-sm font-bold text-lg"
              >
                {streak >= 7 ? (
                  <Trophy className="w-6 h-6 text-celebration" />
                ) : (
                  <Flame className="w-6 h-6 text-celebration" />
                )}
                <span>{streak} {streak === 1 ? 'dag' : 'dagar'} i rad</span>
              </motion.div>
            )}

            <button
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-2xl bg-white/15 hover:bg-white/25 font-semibold transition-colors"
            >
              Tack! 🙌
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
