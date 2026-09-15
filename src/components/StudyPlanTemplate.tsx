import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Activity } from '@/hooks/queries/useHomeworkData';
import type { StudyTechnique } from '@/lib/studyTechniques';

export interface StudyPlanRow {
  id: string;
  title: string;
  dates: string[];
}

interface StudyPlanTemplateProps {
  days: Date[];
  rows: StudyPlanRow[];
  onRowsChange: (rows: StudyPlanRow[]) => void;
  suggestions: StudyTechnique[];
  taskCountsByDate: Record<string, number>;
  getActivitiesForDay: (day: Date) => Activity[];
}

export function StudyPlanTemplate({
  days,
  rows,
  onRowsChange,
  suggestions,
  taskCountsByDate,
  getActivitiesForDay,
}: StudyPlanTemplateProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (rows.length === 0) setActiveIndex(0);
    else if (activeIndex >= rows.length) setActiveIndex(rows.length - 1);
  }, [activeIndex, rows.length]);

  const activeRow = rows[activeIndex];
  const sessions = useMemo(() => rows.reduce((sum, row) => sum + row.dates.length, 0), [rows]);
  const missing = rows.filter(row => row.dates.length === 0).length;

  const updateRow = (index: number, patch: Partial<StudyPlanRow>) => {
    onRowsChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const toggleDate = (date: string) => {
    if (!activeRow) return;
    updateRow(activeIndex, {
      dates: activeRow.dates.includes(date)
        ? activeRow.dates.filter(item => item !== date)
        : [...activeRow.dates, date].sort(),
    });
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onRowsChange(next);
    setActiveIndex(target);
  };

  const removeRow = (index: number) => {
    onRowsChange(rows.filter((_, i) => i !== index));
  };

  const addCustomRow = () => {
    const title = newTitle.trim();
    if (!title) return;
    onRowsChange([...rows, { id: crypto.randomUUID(), title, dates: [] }]);
    setActiveIndex(rows.length);
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 grid grid-cols-3 gap-2 rounded-lg border bg-background p-3 shadow-sm">
        <div><p className="text-xs text-muted-foreground">Moment</p><p className="font-bold">{rows.length}</p></div>
        <div><p className="text-xs text-muted-foreground">Pluggtillfällen</p><p className="font-bold">{sessions}</p></div>
        <div><p className="text-xs text-muted-foreground">Saknar dag</p><p className={cn('font-bold', missing > 0 && 'text-destructive')}>{missing}</p></div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.6fr)]">
        <section className="space-y-3">
          <div>
            <h3 className="font-semibold">Momentens ordning</h3>
            <p className="text-xs text-muted-foreground">Välj ett moment för att planera dess dagar.</p>
          </div>
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={row.id} className={cn('rounded-lg border p-2', activeIndex === index && 'border-primary bg-primary/5')}>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal px-2 text-left" onClick={() => setActiveIndex(index)}>
                    <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                    <span className="truncate">{row.title}</span>
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={index === 0} onClick={() => moveRow(index, -1)} aria-label="Flytta upp"><ArrowUp className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)} aria-label="Flytta ner"><ArrowDown className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(index)} aria-label="Ta bort moment"><X className="h-4 w-4" /></Button>
                </div>
                <p className={cn('pl-10 text-xs', row.dates.length ? 'text-muted-foreground' : 'text-destructive')}>
                  {row.dates.length ? `${row.dates.length} dagar valda` : 'Saknar dag'}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-study-part">Lägg till eget moment</Label>
            <div className="flex gap-2">
              <Input id="new-study-part" value={newTitle} onChange={event => setNewTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustomRow(); } }} placeholder="t.ex. Träna svåra ord" />
              <Button type="button" size="icon" variant="secondary" onClick={addCustomRow} aria-label="Lägg till moment"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.filter(item => !rows.some(row => row.title === item.label)).map(item => (
              <Button key={item.id} type="button" size="sm" variant="outline" onClick={() => { onRowsChange([...rows, { id: crypto.randomUUID(), title: item.label, dates: [] }]); setActiveIndex(rows.length); }}>
                {item.icon} {item.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {activeRow ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="active-study-part">Moment {activeIndex + 1}</Label>
                  <div className="flex gap-1 md:hidden">
                    <Button type="button" size="icon" variant="outline" disabled={activeIndex === 0} onClick={() => setActiveIndex(value => value - 1)} aria-label="Föregående moment"><ArrowLeft className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="outline" disabled={activeIndex === rows.length - 1} onClick={() => setActiveIndex(value => value + 1)} aria-label="Nästa moment"><ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Input id="active-study-part" value={activeRow.title} onChange={event => updateRow(activeIndex, { title: event.target.value })} className="h-11 text-base font-semibold" />
              </div>
              <div>
                <h3 className="font-semibold">Vilka dagar görs momentet?</h3>
                <p className="text-xs text-muted-foreground">Välj gärna flera dagar för repetition.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {days.map(day => {
                  const date = format(day, 'yyyy-MM-dd');
                  const selected = activeRow.dates.includes(date);
                  const homeworkCount = taskCountsByDate[date] || 0;
                  const activities = getActivitiesForDay(day);
                  const busy = homeworkCount + activities.length;
                  const dotClass = busy === 0 ? 'bg-success' : busy <= 2 ? 'bg-warning' : 'bg-destructive';
                  return (
                    <Button key={date} type="button" variant="outline" onClick={() => toggleDate(date)} className={cn('h-auto min-h-24 justify-start whitespace-normal p-3 text-left', selected && 'border-primary bg-primary/10 ring-1 ring-primary')}>
                      <span className="flex w-full items-start gap-3">
                        <span className="min-w-10 text-center"><span className="block text-xs capitalize text-muted-foreground">{format(day, 'EEE', { locale: sv })}</span><span className="block text-lg font-bold">{format(day, 'd')}</span></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-xs"><span className={cn('h-2 w-2 rounded-full', dotClass)} />{homeworkCount === 0 ? 'Inga läxor' : `${homeworkCount} läxor`}</span>
                          {activities.length > 0 && <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">{activities.map(activity => `${activity.emoji || '📌'} ${activity.title}`).join(' · ')}</span>}
                        </span>
                        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', selected && 'border-primary bg-primary text-primary-foreground')}>{selected && <Check className="h-3.5 w-3.5" />}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
              {days.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Välj deadline för att se möjliga dagar.</p>}
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">Lägg till ett moment för att börja planera.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}