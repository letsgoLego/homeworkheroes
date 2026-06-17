import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Palmtree } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { useFamily } from '@/hooks/useFamily';
import { useHolidayMode } from '@/hooks/useHolidayMode';
import { HolidayGoalCard } from '@/components/HolidayGoalCard';
import { HolidayGoalEditor } from '@/components/HolidayGoalEditor';
import { HolidayWeekSummary } from '@/components/HolidayWeekSummary';
import { HolidayToggle } from '@/components/HolidayToggle';
import { HolidayProgressHeader } from '@/components/HolidayProgressHeader';
import { HolidayHeatmap } from '@/components/HolidayHeatmap';
import { HolidayTrophyView } from '@/components/HolidayTrophyView';
import { PerfectDaySplash } from '@/components/PerfectDaySplash';

export default function HolidayPage() {
  const { children, activeChildId, setActiveChildId, userRole, loading } = useFamily();
  const { goals, mode, isActive, isPerfectToday, getGoalStreak } = useHolidayMode(activeChildId);
  const [showPerfect, setShowPerfect] = useState(false);

  const activeChild = children.find(c => c.id === activeChildId);

  // Trigger perfect-day splash once per child+day
  useEffect(() => {
    if (!activeChildId || !isActive || goals.length === 0) return;
    if (!isPerfectToday()) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const key = `holiday-perfect-${activeChildId}-${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setShowPerfect(true);
  }, [activeChildId, isActive, goals, isPerfectToday]);

  // Auto-end if past end date (silently update flag)
  useEffect(() => {
    if (mode?.active && mode.ends_at) {
      const today = format(new Date(), 'yyyy-MM-dd');
      if (mode.ends_at < today) {
        // Will be reflected next time user toggles; harmless to leave.
      }
    }
  }, [mode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-celebration/5 to-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Palmtree className="w-5 h-5 text-celebration" />
            <span className="text-sm text-muted-foreground font-medium">
              {isActive ? 'Lovläge' : 'Vecka'}
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            🌴 {activeChild?.name ?? 'Lov'}s lov
          </h1>
          {mode?.ends_at && isActive && (
            <p className="text-xs text-muted-foreground mt-1">
              T.o.m. {format(new Date(mode.ends_at), 'EEEE d MMMM', { locale: sv })}
            </p>
          )}
        </div>

        {userRole !== 'child' && (
          <div className="px-4 pb-3">
            <ChildSwitcher
              children={children}
              activeChildId={activeChildId}
              onSelectChild={setActiveChildId}
              onAddChild={() => {}}
            />
          </div>
        )}
      </header>

      <main className="px-4 py-4 space-y-4">
        {!activeChildId ? (
          <p className="text-center text-muted-foreground">Välj ett barn</p>
        ) : !isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-card p-6 text-center shadow-card border border-border"
          >
            <div className="text-5xl mb-3">🌴</div>
            <h2 className="text-xl font-bold mb-2">Dags för lov?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Pausa läxor och sätt upp 1–3 egna mål att jobba mot på lovet.
              Fyll i varje dag och dela en sammanfattning med familjen.
            </p>
            <HolidayToggle childId={activeChildId} />
          </motion.div>
        ) : (
          <>
            {goals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-5xl mb-3">🎯</div>
                <h2 className="text-lg font-bold mb-1">Sätt upp dina lovmål</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Välj 1–3 saker du vill göra på lovet
                </p>
              </motion.div>
            ) : (
              <>
                <HolidayProgressHeader childId={activeChildId} />
                <div className="space-y-3">
                  {goals.map((g) => (
                    <HolidayGoalCard key={g.id} goal={g} childId={activeChildId} />
                  ))}
                </div>
              </>
            )}

            <HolidayGoalEditor childId={activeChildId} />

            {goals.length > 0 && (
              <>
                <HolidayHeatmap childId={activeChildId} />
                <div className="pt-2">
                  <HolidayWeekSummary childId={activeChildId} childName={activeChild?.name ?? ''} />
                </div>
              </>
            )}

            <div className="pt-4">
              <HolidayToggle childId={activeChildId} />
            </div>
          </>
        )}
      </main>

      <PerfectDaySplash
        open={showPerfect}
        streak={Math.max(0, ...goals.map(g => getGoalStreak(g.id)))}
        childName={activeChild?.name ?? ''}
        onClose={() => setShowPerfect(false)}
      />


      <Navigation />
    </div>
  );
}
