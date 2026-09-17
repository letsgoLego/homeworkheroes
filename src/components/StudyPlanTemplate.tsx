import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Info, Lightbulb, Plus, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DayLoadIndicator } from '@/components/DayLoadIndicator';
import type { Activity } from '@/hooks/queries/useHomeworkData';
import {
  buildSuggestedPlan,
  STUDY_PHASE_HINTS,
  STUDY_PHASE_LABELS,
  type StudyPhase,
  type StudyTechnique,
} from '@/lib/studyTechniques';


export interface StudyPlanRow {
  id: string;
  title: string;
  dates: string[];
}

// Fixed per-moment palette (index = moment position % palette length).
// Full class strings so Tailwind picks them up.
const MOMENT_COLORS = [
  { dot: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', ring: 'border-teal-500', softBg: 'bg-teal-500/10' },
  { dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', ring: 'border-orange-500', softBg: 'bg-orange-500/10' },
  { dot: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', ring: 'border-violet-500', softBg: 'bg-violet-500/10' },
  { dot: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400', ring: 'border-pink-500', softBg: 'bg-pink-500/10' },
  { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', ring: 'border-amber-500', softBg: 'bg-amber-500/10' },
  { dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', ring: 'border-sky-500', softBg: 'bg-sky-500/10' },
] as const;

const momentColor = (index: number) => MOMENT_COLORS[index % MOMENT_COLORS.length];

const STUDY_PHASES: StudyPhase[] = ['understand', 'practice', 'review'];

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
  const activeSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (rows.length === 0) setActiveIndex(0);
    else if (activeIndex >= rows.length) setActiveIndex(rows.length - 1);
  }, [activeIndex, rows.length]);

  const activeRow = rows[activeIndex];
  const sessions = useMemo(() => rows.reduce((sum, row) => sum + row.dates.length, 0), [rows]);
  const missing = rows.filter(row => row.dates.length === 0).length;
  const completedRows = rows.length - missing;

  const phaseByLabel = useMemo(() => {
    const map = new Map<string, StudyPhase>();
    suggestions.forEach(item => map.set(item.label, item.phase));
    return map;
  }, [suggestions]);

  const hasPracticeRow = rows.some(row => phaseByLabel.get(row.title) === 'practice');
  const singleDayRows = rows.filter(row => row.dates.length === 1).length;
  const activePhase = activeRow ? phaseByLabel.get(activeRow.title) : undefined;

  const applySuggestedPlan = () => {
    const plan = buildSuggestedPlan(days, suggestions);
    if (plan.length === 0) return;
    onRowsChange(plan);
    setActiveIndex(0);
    toast.success('Vi har föreslagit ett upplägg', {
      description: 'Förstå först, träna två gånger och repetera nära förhöret.',
    });
    setTimeout(() => {
      activeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };


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
      <div className="sticky top-0 z-10 space-y-3 rounded-lg border bg-background p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          <div><p className="text-xs text-muted-foreground">Moment</p><p className="font-bold">{rows.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Pluggtillfällen</p><p className="font-bold">{sessions}</p></div>
          <div><p className="text-xs text-muted-foreground">Saknar dag</p><p className={cn('font-bold', missing > 0 && 'text-destructive')}>{missing}</p></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="hidden items-start gap-1.5 text-xs text-muted-foreground md:flex">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Upplägget bygger på forskning om testbaserat lärande och spridd repetition – samma
            studieteknik som skolan lutar sig mot.
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={applySuggestedPlan} disabled={suggestions.length === 0}>
            <Wand2 className="mr-1.5 h-4 w-4" />
            {rows.length > 0 ? 'Gör om förslag' : 'Föreslå upplägg'}
          </Button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="space-y-3 md:hidden">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/40 p-1 text-[11px] font-medium">
            <span className="rounded-md bg-background px-2 py-1 text-center text-primary">1 Moment</span>
            <span className="rounded-md bg-background px-2 py-1 text-center text-primary">2 Dagar</span>
            <span className="rounded-md bg-background px-2 py-1 text-center text-muted-foreground">3 Klart</span>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm font-semibold text-primary">Förslag: förstå först, träna två gånger, repetera nära förhöret.</p>
            <p className="mt-1 text-xs text-muted-foreground">{completedRows}/{rows.length} moment har valda dagar.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rows.map((row, index) => {
              const color = momentColor(index);
              const selected = activeIndex === index;
              const phase = phaseByLabel.get(row.title);
              return (
                <Button
                  key={row.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveIndex(index);
                    activeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    'h-auto min-w-24 flex-col items-center gap-1 whitespace-normal px-2 py-2 text-center',
                    selected && 'border-primary bg-primary/10 ring-1 ring-primary'
                  )}
                >
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', selected ? cn(color.dot, 'text-primary-foreground') : cn('border bg-background', color.ring, color.text))}>{index + 1}</span>
                  <span className="line-clamp-1 max-w-full text-[11px] font-semibold">{phase ? STUDY_PHASE_LABELS[phase] : 'Moment'}</span>
                  <span className={cn('text-[10px] font-normal', row.dates.length ? 'text-primary' : 'text-muted-foreground')}>{row.dates.length ? 'Klar' : 'Välj dag'}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {rows.length > 0 && !hasPracticeRow && (
        <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Lägg till ett moment där du testar dig själv – det är den teknik som ger mest.
        </p>
      )}
      {singleDayRows > 0 && days.length >= 3 && (
        <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Lägg gärna till en dag längre fram för {singleDayRows === 1 ? 'momentet' : 'momenten'} med
          bara en dag – repetition med mellanrum fastnar bäst.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.6fr)]">

        <section className="hidden space-y-3 md:order-1 md:block">
          <div>
            <h3 className="font-semibold">Momentens ordning</h3>
            <p className="text-xs text-muted-foreground">Välj ett moment för att planera dess dagar.</p>
          </div>
          <div className="space-y-2">
            {rows.map((row, index) => {
              const color = momentColor(index);
              const phase = phaseByLabel.get(row.title);
              return (
                <div key={row.id} className={cn('rounded-lg border p-2', activeIndex === index && 'border-primary bg-primary/5')}>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal px-2 text-left" onClick={() => { setActiveIndex(index); activeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                      <span className={cn('mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', color.dot)}>{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{row.title}</span>
                        {phase && (
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {STUDY_PHASE_LABELS[phase]}
                          </span>
                        )}
                      </span>
                    </Button>

                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={index === 0} onClick={() => moveRow(index, -1)} aria-label="Flytta upp"><ArrowUp className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)} aria-label="Flytta ner"><ArrowDown className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(index)} aria-label="Ta bort moment"><X className="h-4 w-4" /></Button>
                  </div>
                  <p className={cn('pl-10 text-xs', row.dates.length ? color.text : 'text-destructive')}>
                    {row.dates.length
                      ? row.dates.map(d => format(parseISO(d), 'EEE d', { locale: sv })).join(', ')
                      : 'Saknar dag'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-study-part">Lägg till eget moment</Label>
            <div className="flex gap-2">
              <Input id="new-study-part" value={newTitle} onChange={event => setNewTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustomRow(); } }} placeholder="t.ex. Träna svåra ord" />
              <Button type="button" size="icon" variant="secondary" onClick={addCustomRow} aria-label="Lägg till moment"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="space-y-3">
            {STUDY_PHASES.map(phase => {
              const items = suggestions.filter(
                item => item.phase === phase && !rows.some(row => row.title === item.label)
              );
              if (items.length === 0) return null;
              return (
                <div key={phase} className="space-y-1.5">
                  <div>
                    <p className="text-xs font-semibold">{STUDY_PHASE_LABELS[phase]}</p>
                    <p className="text-[11px] text-muted-foreground">{STUDY_PHASE_HINTS[phase]}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                      <Button
                        key={item.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        title={item.why}
                        onClick={() => {
                          onRowsChange([...rows, { id: crypto.randomUUID(), title: item.label, dates: [] }]);
                          setActiveIndex(rows.length);
                        }}
                      >
                        {item.icon} {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </section>

        <section ref={activeSectionRef} className="order-1 scroll-mt-24 space-y-4 md:order-2">
          {activeRow ? (
            <>
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3 md:border-0 md:bg-transparent md:p-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Label htmlFor="active-study-part">Aktivt moment {activeIndex + 1}</Label>
                    {activePhase && (
                      <p className="text-xs text-muted-foreground">{STUDY_PHASE_LABELS[activePhase]}</p>
                    )}
                  </div>
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
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {days.map(day => {
                  const date = format(day, 'yyyy-MM-dd');
                  const selected = activeRow.dates.includes(date);
                  const homeworkCount = taskCountsByDate[date] || 0;
                  const activities = getActivitiesForDay(day);
                  const momentsOnDate = rows
                    .map((row, index) => ({ row, index }))
                    .filter(({ row }) => row.dates.includes(date));
                  const activeColor = momentColor(activeIndex);
                  return (
                    <Button key={date} type="button" variant="outline" onClick={() => toggleDate(date)} className={cn('h-auto min-h-24 justify-start whitespace-normal p-3 text-left', selected && cn(activeColor.ring, activeColor.softBg, 'ring-1', activeColor.ring.replace('border-', 'ring-')))}>
                      <span className="flex w-full flex-col gap-2">
                        <span className="flex w-full items-start gap-3">
                          <span className="min-w-10 text-center"><span className="block text-xs capitalize text-muted-foreground">{format(day, 'EEE', { locale: sv })}</span><span className="block text-lg font-bold">{format(day, 'd')}</span></span>
                          <span className="min-w-0 flex-1">
                            <DayLoadIndicator homeworkCount={homeworkCount} activities={activities} />
                          </span>
                          <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', selected && cn(activeColor.ring, activeColor.dot, 'text-white'))}>{selected && <Check className="h-3.5 w-3.5" />}</span>
                        </span>
                        {momentsOnDate.length > 0 && (
                          <span className="flex flex-wrap items-center gap-1">
                            {momentsOnDate.map(({ index }) => {
                              const color = momentColor(index);
                              const isActive = index === activeIndex;
                              return (
                                <span
                                  key={rows[index].id}
                                  title={rows[index].title}
                                  className={cn(
                                    'flex items-center justify-center rounded-full text-[10px] font-bold',
                                    isActive ? cn('h-6 w-6 text-white ring-2 ring-offset-1', color.dot, color.ring.replace('border-', 'ring-')) : cn('h-5 w-5 border bg-background', color.ring, color.text),
                                  )}
                                >
                                  {index + 1}
                                </span>
                              );
                            })}
                          </span>
                        )}
                      </span>
                    </Button>
                  );
                })}
              </div>
              {days.length > 0 && <p className="text-center text-xs text-muted-foreground">Grön = lugn dag · Gul = några läxor · Röd = full dag · Siffrorna visar vilka moment dagen tillhör</p>}
              {days.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Välj deadline för att se möjliga dagar.</p>}
              {rows.length > 1 && (
                <div className="grid grid-cols-2 gap-2 md:hidden">
                  <Button type="button" variant="outline" disabled={activeIndex === 0} onClick={() => setActiveIndex(value => Math.max(0, value - 1))}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Föregående
                  </Button>
                  <Button type="button" variant="secondary" disabled={activeIndex === rows.length - 1} onClick={() => setActiveIndex(value => Math.min(rows.length - 1, value + 1))}>
                    Nästa moment
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              )}
              <details className="rounded-lg border bg-muted/30 p-3 md:hidden">
                <summary className="text-sm font-semibold">Ändra eller lägg till moment</summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    {rows.map((row, index) => {
                      const color = momentColor(index);
                      return (
                        <div key={row.id} className={cn('rounded-lg border bg-background p-2', activeIndex === index && 'border-primary bg-primary/5')}>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal px-2 text-left" onClick={() => setActiveIndex(index)}>
                              <span className={cn('mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground', color.dot)}>{index + 1}</span>
                              <span className="min-w-0 flex-1 truncate">{row.title}</span>
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(index)} aria-label="Ta bort moment"><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-study-part-mobile">Lägg till eget moment</Label>
                    <div className="flex gap-2">
                      <Input id="new-study-part-mobile" value={newTitle} onChange={event => setNewTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustomRow(); } }} placeholder="t.ex. Träna svåra ord" />
                      <Button type="button" size="icon" variant="secondary" onClick={addCustomRow} aria-label="Lägg till moment"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {STUDY_PHASES.map(phase => {
                      const items = suggestions.filter(
                        item => item.phase === phase && !rows.some(row => row.title === item.label)
                      );
                      if (items.length === 0) return null;
                      return (
                        <div key={phase} className="space-y-1.5">
                          <p className="text-xs font-semibold">{STUDY_PHASE_LABELS[phase]}</p>
                          <div className="flex flex-wrap gap-2">
                            {items.map(item => (
                              <Button
                                key={item.id}
                                type="button"
                                size="sm"
                                variant="outline"
                                title={item.why}
                                onClick={() => {
                                  onRowsChange([...rows, { id: crypto.randomUUID(), title: item.label, dates: [] }]);
                                  setActiveIndex(rows.length);
                                }}
                              >
                                {item.icon} {item.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
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