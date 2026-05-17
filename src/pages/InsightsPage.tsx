import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, TrendingUp, Clock, Sparkles, AlertTriangle, Calendar as CalendarIcon, Flag, FileCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { useFamily } from '@/hooks/useFamily';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, parseISO, getDay, getHours, startOfWeek, endOfWeek, differenceInCalendarDays, addWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';
import { SUBJECT_LABELS, SUBJECT_ICONS, type Subject } from '@/types/homework';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
const WEEKDAYS_LONG = ['söndagar', 'måndagar', 'tisdagar', 'onsdagar', 'torsdagar', 'fredagar', 'lördagar'];

type Row = {
  id: string;
  task_date: string;
  completed: boolean;
  completed_at: string | null;
  snoozed_until: string | null;
  homework_id: string;
  homework: { subject: string; child_id: string } | null;
};

type AdhocRow = {
  id: string;
  task_date: string;
  completed: boolean;
  completed_at: string | null;
  child_id: string;
};

type HwRow = {
  id: string;
  title: string;
  subject: string;
  child_id: string;
  completed: boolean;
  due_date: string;
  created_at: string;
  homework_type: string;
};

export default function InsightsPage() {
  const navigate = useNavigate();
  const { children, activeChildId, setActiveChildId, loading: famLoading } = useFamily();
  const [studyTasks, setStudyTasks] = useState<Row[]>([]);
  const [adhoc, setAdhoc] = useState<AdhocRow[]>([]);
  const [homework, setHomework] = useState<HwRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(60);
  const [weekOffset, setWeekOffset] = useState(0);

  const childIds = useMemo(() => children.map((c) => c.id), [children]);

  useEffect(() => {
    if (childIds.length === 0) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      const since = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const [stRes, adRes, hwRes] = await Promise.all([
        supabase
          .from('study_tasks')
          .select('id, task_date, completed, completed_at, snoozed_until, homework_id, homework!inner(subject, child_id)')
          .gte('task_date', since)
          .in('homework.child_id', childIds),
        supabase
          .from('adhoc_tasks')
          .select('id, task_date, completed, completed_at, child_id')
          .gte('task_date', since)
          .in('child_id', childIds),
        supabase
          .from('homework')
          .select('id, title, subject, child_id, completed, due_date, created_at, homework_type')
          .gte('due_date', since)
          .in('child_id', childIds),
      ]);
      if (!mounted) return;
      setStudyTasks((stRes.data as any) || []);
      setAdhoc((adRes.data as any) || []);
      setHomework((hwRes.data as any) || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [childIds.join(','), days]);

  // Filter by active child
  const filteredStudy = useMemo(
    () => (activeChildId ? studyTasks.filter((s) => s.homework?.child_id === activeChildId) : studyTasks),
    [studyTasks, activeChildId]
  );
  const filteredAdhoc = useMemo(
    () => (activeChildId ? adhoc.filter((a) => a.child_id === activeChildId) : adhoc),
    [adhoc, activeChildId]
  );
  const filteredHw = useMemo(
    () => (activeChildId ? homework.filter((h) => h.child_id === activeChildId) : homework),
    [homework, activeChildId]
  );

  const stats = useMemo(() => {
    const allPlanned = [
      ...filteredStudy.map((s) => ({
        date: s.task_date,
        completed: s.completed,
        completed_at: s.completed_at,
        snoozed: !!s.snoozed_until,
        subject: (s.homework?.subject as Subject) || 'other',
      })),
      ...filteredAdhoc.map((a) => ({
        date: a.task_date,
        completed: a.completed,
        completed_at: a.completed_at,
        snoozed: false,
        subject: 'other' as Subject,
      })),
    ];

    // Per weekday: completion rate based on planned date
    const byWeekday: { wd: number; planned: number; done: number }[] = Array.from({ length: 7 }, (_, i) => ({
      wd: i, planned: 0, done: 0,
    }));
    allPlanned.forEach((t) => {
      try {
        const wd = getDay(parseISO(t.date));
        byWeekday[wd].planned += 1;
        if (t.completed) byWeekday[wd].done += 1;
      } catch {}
    });

    // Per weekday by completion timestamp (when did they actually check off)
    const completionsByWeekday: number[] = Array(7).fill(0);
    const completionsByHour: number[] = Array(24).fill(0);
    allPlanned.forEach((t) => {
      if (t.completed && t.completed_at) {
        try {
          const d = parseISO(t.completed_at);
          completionsByWeekday[getDay(d)] += 1;
          completionsByHour[getHours(d)] += 1;
        } catch {}
      }
    });

    // Per subject
    const subjects: Record<string, { planned: number; done: number; snoozed: number }> = {};
    filteredStudy.forEach((s) => {
      const sub = s.homework?.subject || 'other';
      subjects[sub] = subjects[sub] || { planned: 0, done: 0, snoozed: 0 };
      subjects[sub].planned += 1;
      if (s.completed) subjects[sub].done += 1;
      if (s.snoozed_until) subjects[sub].snoozed += 1;
    });

    // Homework not completed by due date (postponed/abandoned subjects)
    const overdueBySubject: Record<string, number> = {};
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    filteredHw.forEach((h) => {
      if (!h.completed && h.due_date < todayStr) {
        overdueBySubject[h.subject] = (overdueBySubject[h.subject] || 0) + 1;
      }
    });

    const totalPlanned = allPlanned.length;
    const totalDone = allPlanned.filter((t) => t.completed).length;
    const overallRate = totalPlanned ? Math.round((totalDone / totalPlanned) * 100) : 0;

    return { byWeekday, completionsByWeekday, completionsByHour, subjects, overdueBySubject, totalPlanned, totalDone, overallRate };
  }, [filteredStudy, filteredAdhoc, filteredHw]);

  const bestWeekday = useMemo(() => {
    let best = -1, bestVal = -1;
    stats.byWeekday.forEach((d) => {
      const rate = d.planned ? d.done / d.planned : 0;
      if (d.planned >= 2 && rate > bestVal) { bestVal = rate; best = d.wd; }
    });
    return best >= 0 ? { wd: best, rate: Math.round(bestVal * 100) } : null;
  }, [stats]);

  const worstWeekday = useMemo(() => {
    let worst = -1, worstVal = 2;
    stats.byWeekday.forEach((d) => {
      const rate = d.planned ? d.done / d.planned : 1;
      if (d.planned >= 2 && rate < worstVal) { worstVal = rate; worst = d.wd; }
    });
    return worst >= 0 ? { wd: worst, rate: Math.round(worstVal * 100) } : null;
  }, [stats]);

  const bestHour = useMemo(() => {
    let best = -1, max = 0;
    stats.completionsByHour.forEach((c, h) => {
      if (c > max) { max = c; best = h; }
    });
    return best >= 0 && max > 0 ? { hour: best, count: max } : null;
  }, [stats]);

  const sortedSubjects = useMemo(
    () => Object.entries(stats.subjects).sort((a, b) => b[1].planned - a[1].planned),
    [stats]
  );

  const topSnoozed = useMemo(
    () => Object.entries(stats.subjects)
      .filter(([, v]) => v.snoozed > 0)
      .sort((a, b) => b[1].snoozed - a[1].snoozed)
      .slice(0, 3),
    [stats]
  );

  const topOverdue = useMemo(
    () => Object.entries(stats.overdueBySubject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
    [stats]
  );

  const maxWeekdayPlanned = Math.max(...stats.byWeekday.map((d) => d.planned), 1);
  const maxHour = Math.max(...stats.completionsByHour, 1);

  const weekItems = useMemo(() => {
    const today = new Date();
    const wkStart = startOfWeek(today, { weekStartsOn: 1 });
    const wkEnd = endOfWeek(today, { weekStartsOn: 1 });
    const startStr = format(wkStart, 'yyyy-MM-dd');
    const endStr = format(wkEnd, 'yyyy-MM-dd');
    const items = filteredHw
      .filter((h) => h.due_date >= startStr && h.due_date <= endStr)
      .map((h) => {
        const tasks = filteredStudy.filter((s) => s.homework_id === h.id);
        const total = tasks.length;
        const done = tasks.filter((t) => t.completed).length;
        const progress = total ? Math.round((done / total) * 100) : (h.completed ? 100 : 0);
        const daysLeft = differenceInCalendarDays(parseISO(h.due_date), today);
        // Readiness signal: completed, on track, behind
        let status: 'done' | 'ontrack' | 'behind' | 'open';
        if (h.completed) status = 'done';
        else if (total === 0) status = 'open';
        else {
          // expected progress = elapsed task days / total
          const pastTasks = tasks.filter((t) => t.task_date <= format(today, 'yyyy-MM-dd')).length;
          const expected = total ? pastTasks / total : 0;
          const actual = total ? done / total : 0;
          status = actual + 0.01 >= expected ? 'ontrack' : 'behind';
        }
        return { hw: h, total, done, progress, daysLeft, status };
      })
      .sort((a, b) => a.hw.due_date.localeCompare(b.hw.due_date));
    const inlamningar = items.filter((i) => i.hw.homework_type === 'inlamning');
    const forhor = items.filter((i) => i.hw.homework_type === 'forhor');
    return { items, inlamningar, forhor, wkStart, wkEnd };
  }, [filteredHw, filteredStudy]);

  if (famLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/family')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Insikter
          </h1>
        </div>
        {children.length > 0 && (
          <div className="px-4 pb-3">
            <ChildSwitcher
              children={children}
              activeChildId={activeChildId}
              onSelectChild={setActiveChildId}
              onAddChild={() => navigate('/family')}
              showPresence={false}
            />
          </div>
        )}
      </header>

      <main className="px-4 py-4 space-y-5">
        {/* Time range */}
        <div className="flex gap-2">
          {[30, 60, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
              className="flex-1"
            >
              {d} dgr
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : stats.totalPlanned === 0 ? (
          <div className="p-6 rounded-2xl bg-secondary text-center">
            <p className="text-sm text-muted-foreground">
              Ingen data ännu för vald period. Lägg till läxor och bocka av uppgifter för att se insikter.
            </p>
          </div>
        ) : (
          <>
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Senaste {days} dagarna</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{stats.overallRate}%</span>
                <span className="text-sm text-muted-foreground mb-1.5">av planerade uppgifter klara</span>
              </div>
              <p className="text-sm mt-2">
                {stats.totalDone} av {stats.totalPlanned} uppgifter slutförda
              </p>
            </motion.div>

            {/* This week's hand-ins & tests */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-card shadow-card space-y-3"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  Veckan som kommer
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {format(weekItems.wkStart, 'd MMM', { locale: sv })}–{format(weekItems.wkEnd, 'd MMM', { locale: sv })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-1.5 text-warning-foreground">
                    <Flag className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase">Inlämningar</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{weekItems.inlamningar.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/30">
                  <div className="flex items-center gap-1.5 text-destructive">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase">Förhör</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{weekItems.forhor.length}</p>
                </div>
              </div>

              {weekItems.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Inga inlämningar eller förhör den här veckan 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {weekItems.items.map(({ hw, total, done, progress, daysLeft, status }) => (
                    <div
                      key={hw.id}
                      className={cn(
                        'p-3 rounded-xl border',
                        status === 'done' && 'bg-success/10 border-success/30',
                        status === 'ontrack' && 'bg-card border-border',
                        status === 'behind' && 'bg-destructive/5 border-destructive/30',
                        status === 'open' && 'bg-muted/40 border-border',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span>{SUBJECT_ICONS[hw.subject as Subject] || '📝'}</span>
                        <span className="font-medium text-sm flex-1 truncate">{hw.title}</span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase flex items-center gap-1',
                            hw.homework_type === 'forhor'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/15 text-warning-foreground',
                          )}
                        >
                          {hw.homework_type === 'forhor' ? <FileCheck className="w-2.5 h-2.5" /> : <Flag className="w-2.5 h-2.5" />}
                          {hw.homework_type === 'forhor' ? 'Förhör' : 'Inlämning'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              status === 'done' && 'bg-success',
                              status === 'behind' && 'bg-destructive',
                              (status === 'ontrack' || status === 'open') && 'bg-primary',
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
                          {total > 0 ? `${done}/${total}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px]">
                        <span className="text-muted-foreground">
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} dgr försent`
                            : daysLeft === 0
                            ? 'Idag!'
                            : daysLeft === 1
                            ? 'Imorgon'
                            : `Om ${daysLeft} dgr`}
                          {' · '}
                          {format(parseISO(hw.due_date), 'EEE d MMM', { locale: sv })}
                        </span>
                        <span
                          className={cn(
                            'font-semibold',
                            status === 'done' && 'text-success',
                            status === 'ontrack' && 'text-primary',
                            status === 'behind' && 'text-destructive',
                            status === 'open' && 'text-muted-foreground',
                          )}
                        >
                          {status === 'done' && '✓ Klar'}
                          {status === 'ontrack' && '👍 På spåret'}
                          {status === 'behind' && '⚠️ Efter'}
                          {status === 'open' && 'Inga delsteg'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>


            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card">
                <div className="flex items-center gap-2 text-celebration mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Bästa dag</span>
                </div>
                {bestWeekday ? (
                  <>
                    <p className="text-xl font-bold capitalize">{WEEKDAYS_LONG[bestWeekday.wd]}</p>
                    <p className="text-xs text-muted-foreground">{bestWeekday.rate}% klart</p>
                  </>
                ) : <p className="text-sm text-muted-foreground">För lite data</p>}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card">
                <div className="flex items-center gap-2 text-destructive mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Tuffaste dag</span>
                </div>
                {worstWeekday ? (
                  <>
                    <p className="text-xl font-bold capitalize">{WEEKDAYS_LONG[worstWeekday.wd]}</p>
                    <p className="text-xs text-muted-foreground">{worstWeekday.rate}% klart</p>
                  </>
                ) : <p className="text-sm text-muted-foreground">För lite data</p>}
              </motion.div>
            </div>

            {/* Best time */}
            {bestHour && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Bästa tid att plugga</span>
                </div>
                <p className="text-xl font-bold">kl {String(bestHour.hour).padStart(2, '0')}:00–{String((bestHour.hour + 1) % 24).padStart(2, '0')}:00</p>
                <p className="text-xs text-muted-foreground">Flest avbockningar denna timme ({bestHour.count} st)</p>
              </motion.div>
            )}

            {/* Weekday bars */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Avbockade per veckodag
              </h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                  const d = stats.byWeekday[wd];
                  const rate = d.planned ? Math.round((d.done / d.planned) * 100) : 0;
                  const widthPct = (d.planned / maxWeekdayPlanned) * 100;
                  const donePct = d.planned ? (d.done / d.planned) * 100 : 0;
                  return (
                    <div key={wd} className="flex items-center gap-2 text-sm">
                      <span className="w-10 text-muted-foreground">{WEEKDAYS[wd]}</span>
                      <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden relative">
                        <div className="h-full bg-muted-foreground/20" style={{ width: `${widthPct}%` }}>
                          <div className="h-full bg-primary" style={{ width: `${donePct}%` }} />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums">{d.done}/{d.planned}</span>
                      <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{rate}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Hour distribution */}
            {stats.completionsByHour.some((c) => c > 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Tid på dygnet
                </h3>
                <div className="flex items-end gap-0.5 h-24">
                  {stats.completionsByHour.map((c, h) => (
                    <div
                      key={h}
                      className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition-colors"
                      style={{ height: `${(c / maxHour) * 100}%`, minHeight: c ? 2 : 0 }}
                      title={`kl ${h}:00 – ${c} avbockningar`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
                </div>
              </motion.div>
            )}

            {/* Subjects */}
            {sortedSubjects.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Ämnen – tid och fokus
                </h3>
                <div className="space-y-3">
                  {sortedSubjects.map(([sub, v]) => {
                    const rate = v.planned ? Math.round((v.done / v.planned) * 100) : 0;
                    return (
                      <div key={sub}>
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="flex items-center gap-2">
                            <span>{SUBJECT_ICONS[sub as Subject] || '📝'}</span>
                            <span className="font-medium">{SUBJECT_LABELS[sub as Subject] || sub}</span>
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {v.done}/{v.planned} • {rate}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Snoozed subjects */}
            {topSnoozed.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card">
                <h3 className="font-bold mb-3">Skjuts ofta upp 😴</h3>
                <div className="space-y-2">
                  {topSnoozed.map(([sub, v]) => (
                    <div key={sub} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{SUBJECT_ICONS[sub as Subject] || '📝'}</span>
                        <span>{SUBJECT_LABELS[sub as Subject] || sub}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{v.snoozed} ggr snoozat</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Overdue subjects */}
            {topOverdue.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card border border-destructive/20">
                <h3 className="font-bold mb-3 text-destructive">Blir ofta inte klart i tid ⚠️</h3>
                <div className="space-y-2">
                  {topOverdue.map(([sub, n]) => (
                    <div key={sub} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{SUBJECT_ICONS[sub as Subject] || '📝'}</span>
                        <span>{SUBJECT_LABELS[sub as Subject] || sub}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{n} läxor förbi deadline</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <p className="text-[11px] text-muted-foreground text-center pt-2">
              Insikter baseras på {format(subDays(new Date(), days), 'd MMM', { locale: sv })} – {format(new Date(), 'd MMM', { locale: sv })}.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
