import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { format, startOfWeek, addDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Share2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHolidayMode } from '@/hooks/useHolidayMode';
import { toast } from 'sonner';

interface Props {
  childId: string;
  childName: string;
}

export function HolidayWeekSummary({ childId, childName }: Props) {
  const { goals, getWeekEntries, getGoalStreak, getGoalTotal, getPerfectDays } = useHolidayMode(childId);
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekNumber = format(weekStart, 'w');

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
      const file = new File([blob], `lovsammanfattning-v${weekNumber}.png`, { type: 'image/png' });

      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `${childName}s lovsammanfattning`,
          text: `${childName}s lov vecka ${weekNumber} 🌴`,
        });
      } else {
        // Fallback: download
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `lovsammanfattning-v${weekNumber}.png`;
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

  if (goals.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-2xl">
          <Share2 className="w-4 h-4 mr-2" />
          Veckosammanfattning
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Sammanfattning – vecka {weekNumber}</DialogTitle>
        </DialogHeader>

        {/* Shareable card */}
        <div className="px-4 pb-2">
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-primary/10 via-background to-celebration/15 rounded-3xl p-6 border border-border"
          >
            <div className="text-center mb-5">
              <div className="text-3xl mb-1">🌴</div>
              <h2 className="text-2xl font-extrabold">{childName}s lov</h2>
              <p className="text-sm text-muted-foreground">
                Vecka {weekNumber} · {format(weekStart, 'd MMM', { locale: sv })} – {format(weekEnd, 'd MMM', { locale: sv })}
              </p>
            </div>

            {/* Hero stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="rounded-xl bg-background/60 p-2 text-center">
                <div className="text-lg">🔥</div>
                <div className="text-base font-bold">{Math.max(0, ...goals.map(g => getGoalStreak(g.id)))}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">bästa streak</div>
              </div>
              <div className="rounded-xl bg-background/60 p-2 text-center">
                <div className="text-lg">🏆</div>
                <div className="text-base font-bold">{getPerfectDays().length}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">perfekta dagar</div>
              </div>
              <div className="rounded-xl bg-background/60 p-2 text-center">
                <div className="text-lg">⭐</div>
                <div className="text-base font-bold">{goals.reduce((a, g) => a + getGoalTotal(g.id), 0)}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">poäng totalt</div>
              </div>
            </div>


            <div className="space-y-4">
              {goals.map((g) => {
                const days = getWeekEntries(g.id, weekStart);
                const total = days.reduce((a, d) => a + d.value, 0);
                const target = g.daily_target ?? 1;
                const isCheckbox = g.type === 'checkbox_per_day';
                const isTotal = g.type === 'total_for_holiday';
                const reachedDays = isCheckbox
                  ? days.filter(d => d.value > 0).length
                  : days.filter(d => d.value >= target).length;
                const max = Math.max(target, ...days.map(d => d.value), 1);

                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{g.emoji}</span>
                        <span className="font-semibold text-sm">{g.name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: g.color }}>
                        {isCheckbox
                          ? `${reachedDays}/7 dagar`
                          : isTotal
                            ? `${total} totalt`
                            : `${total} · ${reachedDays}/7 ✓`}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {days.map((d, i) => {
                        const h = isCheckbox
                          ? (d.value > 0 ? 100 : 8)
                          : Math.max(8, (d.value / max) * 100);
                        const hit = isCheckbox ? d.value > 0 : d.value >= target;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex-1 flex items-end">
                              <div
                                className="w-full rounded-md transition-all"
                                style={{
                                  height: `${h}%`,
                                  backgroundColor: hit ? g.color : `${g.color}55`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {format(d.date, 'EEEEE', { locale: sv })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">Läxhjälpen 🌴 Lovläge</p>
            </div>
          </div>
        </div>

        <div className="p-4 flex gap-2 sticky bottom-0 bg-background border-t border-border">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Stäng
          </Button>
          <Button onClick={handleShare} disabled={busy} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            {busy ? 'Skapar...' : 'Dela bild'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
