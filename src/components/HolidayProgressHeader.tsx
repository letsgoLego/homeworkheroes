import { motion } from 'framer-motion';
import { Sparkles, Star, Flame, Trophy } from 'lucide-react';
import { useHolidayMode } from '@/hooks/useHolidayMode';

interface Props { childId: string; }

export function HolidayProgressHeader({ childId }: Props) {
  const { goals, getGoalTotal, getGoalStreak, getPerfectDays, getHolidayXp } = useHolidayMode(childId);

  if (goals.length === 0) return null;

  const xp = getHolidayXp();
  const perfectDays = getPerfectDays().length;
  const bestStreak = Math.max(0, ...goals.map(g => getGoalStreak(g.id)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Level / XP card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-celebration/20 via-primary/10 to-accent/15 p-4 border border-celebration/30">
        <div className="absolute top-2 right-2">
          <Sparkles className="w-6 h-6 text-celebration/30" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-celebration to-primary shadow-lg shrink-0">
            <Star className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{xp.title}</p>
            <p className="text-xs text-muted-foreground">Nivå {xp.level} · {xp.xp} lov-XP</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (xp.xpInLevel / xp.xpToNext) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-celebration to-primary"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {xp.xpInLevel} / {xp.xpToNext} XP till nästa nivå
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-500/10 p-4 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-medium text-muted-foreground">Bästa streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-500">{bestStreak}</p>
          <p className="text-[11px] text-muted-foreground">
            {bestStreak === 1 ? 'dag i rad' : 'dagar i rad'}
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-success/15 to-emerald-500/10 p-4 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-success" />
            <span className="text-xs font-medium text-muted-foreground">Perfekta dagar</span>
          </div>
          <p className="text-3xl font-bold text-success">{perfectDays}</p>
          <p className="text-[11px] text-muted-foreground">alla mål nådda</p>
        </div>
      </div>

      {/* Per-goal totals strip */}
      <div className="rounded-2xl bg-card p-3 border border-border">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${goals.length}, minmax(0, 1fr))` }}>
          {goals.map(g => {
            const total = getGoalTotal(g.id);
            return (
              <div key={g.id} className="text-center">
                <div className="text-xl">{g.emoji}</div>
                <div className="text-lg font-bold leading-tight" style={{ color: g.color }}>{total}</div>
                <div className="text-[10px] text-muted-foreground leading-tight truncate">{g.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
