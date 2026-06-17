import { useMemo } from 'react';
import { format, addDays, differenceInCalendarDays, parseISO, startOfWeek } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useHolidayMode } from '@/hooks/useHolidayMode';

interface Props { childId: string; }

export function HolidayHeatmap({ childId }: Props) {
  const { goals, mode, getEntryValue } = useHolidayMode(childId);

  const cells = useMemo(() => {
    if (goals.length === 0 || !mode?.started_at) return [];
    const start = parseISO(mode.started_at.slice(0, 10));
    const today = new Date();
    const totalDays = Math.max(7, Math.min(56, differenceInCalendarDays(today, start) + 1));
    const startDate = addDays(today, -(totalDays - 1));

    return Array.from({ length: totalDays }).map((_, i) => {
      const d = addDays(startDate, i);
      const ds = format(d, 'yyyy-MM-dd');
      let hit = 0;
      for (const g of goals) {
        const v = getEntryValue(g.id, ds);
        const reached = (g.type === 'checkbox_per_day' || g.type === 'total_for_holiday')
          ? v > 0
          : v >= (g.daily_target ?? 1);
        if (reached) hit++;
      }
      const ratio = goals.length > 0 ? hit / goals.length : 0;
      return { date: d, dateStr: ds, ratio, hit };
    });
  }, [goals, mode, getEntryValue]);

  if (cells.length === 0) return null;

  // Group into weeks starting Monday
  const firstMonday = startOfWeek(cells[0].date, { weekStartsOn: 1 });
  const weeks: (typeof cells[0] | null)[][] = [];
  const cellMap = new Map(cells.map(c => [c.dateStr, c]));
  const lastDate = cells[cells.length - 1].date;
  let cursor = firstMonday;
  while (cursor <= lastDate) {
    const week: (typeof cells[0] | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(cursor, i);
      const ds = format(d, 'yyyy-MM-dd');
      week.push(cellMap.get(ds) ?? null);
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  const colorFor = (ratio: number) => {
    if (ratio === 0) return 'hsl(var(--muted))';
    if (ratio < 0.4) return 'hsl(var(--celebration) / 0.3)';
    if (ratio < 0.7) return 'hsl(var(--celebration) / 0.55)';
    if (ratio < 1) return 'hsl(var(--celebration) / 0.8)';
    return 'hsl(var(--celebration))';
  };

  const dayLabels = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

  return (
    <div className="rounded-2xl bg-card p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Din lov-karta</h3>
        <span className="text-[10px] text-muted-foreground">
          {format(cells[0].date, 'd MMM', { locale: sv })} – idag
        </span>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 pt-0.5">
          {dayLabels.map((l, i) => (
            <div key={i} className="h-4 text-[9px] text-muted-foreground flex items-center">{l}</div>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((c, di) => (
                <div
                  key={di}
                  className="w-4 h-4 rounded-sm"
                  style={{
                    backgroundColor: c ? colorFor(c.ratio) : 'transparent',
                    border: c?.ratio === 1 ? '1px solid hsl(var(--celebration))' : undefined,
                  }}
                  title={c ? `${format(c.date, 'EEE d MMM', { locale: sv })} – ${c.hit}/${goals.length}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-muted-foreground">
        <span>Mindre</span>
        {[0, 0.3, 0.55, 0.8, 1].map((r, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorFor(r) }} />
        ))}
        <span>Mer</span>
      </div>
    </div>
  );
}
