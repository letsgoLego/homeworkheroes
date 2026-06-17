import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import { Download, Share2, RotateCcw, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useHolidayMode, type HolidayGoal } from '@/hooks/useHolidayMode';
import { HolidayToggle } from './HolidayToggle';

interface Props {
  childId: string;
  childName: string;
}

type Medal = { emoji: string; label: string; color: string };

function getMedal(pct: number): Medal {
  if (pct >= 0.9) return { emoji: '🥇', label: 'Guld', color: '#f5b301' };
  if (pct >= 0.6) return { emoji: '🥈', label: 'Silver', color: '#9aa5b1' };
  if (pct >= 0.3) return { emoji: '🥉', label: 'Brons', color: '#cd7f32' };
  return { emoji: '🎗️', label: 'Deltagit', color: '#94a3b8' };
}

export function HolidayTrophyView({ childId, childName }: Props) {
  const {
    mode, goals, entries, getGoalStreak, getGoalTotal, getPerfectDays, getHolidayXp,
  } = useHolidayMode(childId);
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  if (!mode || mode.active || goals.length === 0) return null;

  // Determine holiday span
  const startStr = mode.started_at ? format(new Date(mode.started_at), 'yyyy-MM-dd') : null;
  const endStr = mode.ends_at && mode.ends_at <= format(new Date(), 'yyyy-MM-dd')
    ? mode.ends_at
    : format(new Date(), 'yyyy-MM-dd');
  const start = startStr ? parseISO(startStr) : null;
  const end = parseISO(endStr);
  const totalDays = start ? Math.max(1, differenceInCalendarDays(end, start) + 1) : 1;

  const entriesInRange = (goalId: string) =>
    entries.filter(e =>
      e.goal_id === goalId
      && (!startStr || e.entry_date >= startStr)
      && e.entry_date <= endStr
    );

  const getCompletion = (g: HolidayGoal): number => {
    const list = entriesInRange(g.id);
    if (g.type === 'total_for_holiday') {
      const total = list.reduce((a, e) => a + (e.value || 0), 0);
      return Math.min(1, total / Math.max(1, g.total_target ?? 1));
    }
    if (g.type === 'checkbox_per_day') {
      const hitDays = list.filter(e => e.value > 0).length;
      return Math.min(1, hitDays / totalDays);
    }
    const target = g.daily_target ?? 1;
    const hitDays = list.filter(e => e.value >= target).length;
    return Math.min(1, hitDays / totalDays);
  };

  const xp = getHolidayXp();
  const perfectDays = getPerfectDays().length;
  const bestStreak = Math.max(0, ...goals.map(g => getGoalStreak(g.id)));
  const overall = goals.reduce((a, g) => a + getCompletion(g), 0) / goals.length;
  const overallMedal = getMedal(overall);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `lov-troféer-${childName}.png`, { type: 'image/png' });

      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `${childName}s lov-troféer`,
          text: `${childName} avslutade lovet! 🌴🏆`,
        });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `lov-troféer-${childName}.png`;
        a.click();
        toast.success('Bild nedladdad!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Kunde inte skapa bild');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div
        ref={cardRef}
        className="rounded-3xl bg-gradient-to-br from-celebration/15 via-background to-primary/10 p-6 border border-border shadow-card"
      >
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">{overallMedal.emoji}</div>
          <h2 className="text-2xl font-extrabold">{childName}s lov-troféer</h2>
          <p className="text-sm text-muted-foreground">
            {start && format(start, 'd MMM', { locale: sv })} – {format(end, 'd MMM', { locale: sv })} · {totalDays} dagar
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-celebration/15 text-celebration text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            {xp.title}
          </div>
        </div>

        {/* Per-goal medals */}
        <div className="space-y-3 mb-5">
          {goals.map(g => {
            const pct = getCompletion(g);
            const medal = getMedal(pct);
            const total = getGoalTotal(g.id);
            const isTotal = g.type === 'total_for_holiday';
            const isCheckbox = g.type === 'checkbox_per_day';
            const isMinutes = g.type === 'minutes_per_day';
            const detail = isTotal
              ? `${total} / ${g.total_target}`
              : isCheckbox
                ? `${Math.round(pct * totalDays)} / ${totalDays} dagar`
                : `${total}${isMinutes ? ' min' : ''} · ${Math.round(pct * totalDays)}/${totalDays} dagar i mål`;
            return (
              <div
                key={g.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-background/70 border border-border"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: `${g.color}22` }}
                >
                  {g.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{detail}</div>
                  <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct * 100}%`, backgroundColor: g.color }}
                    />
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-3xl leading-none">{medal.emoji}</div>
                  <div className="text-[10px] font-bold mt-0.5" style={{ color: medal.color }}>
                    {medal.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-background/60 p-2 text-center">
            <div className="text-lg">🔥</div>
            <div className="text-base font-bold">{bestStreak}</div>
            <div className="text-[9px] text-muted-foreground">bästa streak</div>
          </div>
          <div className="rounded-xl bg-background/60 p-2 text-center">
            <div className="text-lg">🏆</div>
            <div className="text-base font-bold">{perfectDays}</div>
            <div className="text-[9px] text-muted-foreground">perfekta dagar</div>
          </div>
          <div className="rounded-xl bg-background/60 p-2 text-center">
            <div className="text-lg">⭐</div>
            <div className="text-base font-bold">{xp.xp}</div>
            <div className="text-[9px] text-muted-foreground">lov-XP</div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">Läxhjälpen 🌴 Lovläge</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleShare} disabled={busy} className="flex-1 rounded-2xl">
          <Share2 className="w-4 h-4 mr-2" />
          {busy ? 'Skapar...' : 'Dela troféerna'}
        </Button>
        <Button variant="outline" onClick={handleShare} disabled={busy} size="icon" className="rounded-2xl">
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <div className="rounded-2xl bg-card p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Redo för nästa lov?</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Starta ett nytt lov för att sätta upp nya mål. Dina gamla troféer sparas tills dess.
        </p>
        <HolidayToggle childId={childId} />
      </div>
    </motion.div>
  );
}
