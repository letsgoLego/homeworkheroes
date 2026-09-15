import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfDay, eachDayOfInterval, isBefore } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Plus, X, CalendarCheck, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useFamily } from '@/hooks/useFamily';
import { celebrateAssignment } from '@/lib/confetti';
import { track } from '@/lib/analytics';
import { SUBJECT_LABELS, SUBJECT_ICONS, HOMEWORK_TYPE_LABELS, Subject, HomeworkType } from '@/types/homework';
import { getStudyTechniqueSuggestions, type StudyTechnique } from '@/lib/studyTechniques';
import type { InboxHomework } from '@/hooks/queries/useHomeworkData';

interface PlanHomeworkSheetProps {
  homework: InboxHomework | null;
  onClose: () => void;
}

interface PlanRow {
  id: string;
  title: string;
  dates: string[];
}

const subjects: Subject[] = ['math', 'science', 'language', 'history', 'art', 'music', 'english', 'other'];

export function PlanHomeworkSheet({ homework, onClose }: PlanHomeworkSheetProps) {
  const { planHomework, updateHomework, homework: allHomework, getActivitiesForDate } = useFamily();
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialisedFor, setInitialisedFor] = useState<string | null>(null);

  // Editable homework details (the child fills in what the parent didn't know)
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('other');
  const [homeworkType, setHomeworkType] = useState<HomeworkType>('inlamning');
  const [dueDate, setDueDate] = useState('');
  const [dueDateKnown, setDueDateKnown] = useState(true);
  const [note, setNote] = useState('');

  // Available days: today .. due date
  const days = useMemo(() => {
    if (!homework || !dueDate) return [];
    const today = startOfDay(new Date());
    const due = startOfDay(parseISO(dueDate));
    if (isBefore(due, today)) return [today];
    return eachDayOfInterval({ start: today, end: due });
  }, [homework, dueDate]);

  // Existing workload per day for this child
  const taskCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!homework) return counts;
    allHomework
      .filter(hw => hw.child_id === homework.child_id)
      .forEach(hw => {
        hw.tasks.forEach(task => {
          if (!task.completed) {
            counts[task.task_date] = (counts[task.task_date] || 0) + 1;
          }
        });
      });
    return counts;
  }, [allHomework, homework]);


  // Suggestions follow the child's own choice of subject/type
  const studyTechniqueSuggestions = useMemo(
    () => getStudyTechniqueSuggestions(subject, homeworkType),
    [subject, homeworkType]
  );

  // Initialise rows from parent's plan items, or with study technique suggestions for exams
  if (homework && initialisedFor !== homework.id) {
    const hwSubject = homework.subject as Subject;
    const hwType = (homework.homework_type as HomeworkType) || 'inlamning';
    const suggestions = getStudyTechniqueSuggestions(hwSubject, hwType);
    let base: PlanRow[] = [];
    if (homework.planItems.length > 0) {
      base = homework.planItems.map(item => ({ id: crypto.randomUUID(), title: item.title, dates: [] }));
    } else if (hwType === 'forhor' && suggestions.length > 0) {
      base = suggestions.slice(0, 5).map(t => ({ id: crypto.randomUUID(), title: t.label, dates: [] }));
    } else {
      base = [{ id: crypto.randomUUID(), title: homework.title, dates: [] }];
    }
    setRows(base);
    setTitle(homework.title);
    setSubject(hwSubject);
    setHomeworkType(hwType);
    const confirmed = (homework as { due_date_confirmed?: boolean }).due_date_confirmed !== false;
    setDueDateKnown(confirmed);
    setDueDate(confirmed ? homework.due_date : '');
    setNote('');
    setInitialisedFor(homework.id);
  }

  if (!homework) return null;

  const toggleRowDate = (index: number, date: string) => {
    setRows(prev =>
      prev.map((r, i) =>
        i === index
          ? { ...r, dates: r.dates.includes(date) ? r.dates.filter(d => d !== date) : [...r.dates, date].sort() }
          : r
      )
    );
  };

  const moveRow = (index: number, dir: -1 | 1) => {
    setRows(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addRow = () => {
    const value = newTitle.trim();
    if (!value) return;
    setRows(prev => [...prev, { id: crypto.randomUUID(), title: value, dates: [] }]);
    setNewTitle('');
  };

  const renameRow = (index: number, value: string) => {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, title: value } : r)));
  };

  const finalTitle = title.trim() || SUBJECT_LABELS[subject];
  const allPlanned = rows.length > 0 && rows.every(r => r.dates.length > 0);
  const sessionCount = rows.reduce((sum, r) => sum + r.dates.length, 0);
  const canSave = allPlanned && !!dueDate;
  const edited =
    finalTitle !== homework.title ||
    subject !== homework.subject ||
    homeworkType !== homework.homework_type ||
    dueDate !== homework.due_date ||
    note.trim().length > 0;

  const handleSave = async () => {
    if (!dueDate) {
      toast.error('Välj när läxan ska vara klar');
      return;
    }
    if (!allPlanned) {
      toast.error('Välj minst en dag för varje del');
      return;
    }
    setSaving(true);
    const description = [homework.description?.trim(), note.trim()].filter(Boolean).join('\n');
    const updated = await updateHomework(
      homework.id,
      {
        title: finalTitle,
        subject,
        homeworkType,
        dueDate,
        dueDateConfirmed: true,
        description: description || undefined,
      },
      { silent: true }
    );
    if (!updated) {
      setSaving(false);
      return;
    }
    const ok = await planHomework(
      homework.id,
      rows.flatMap(r => r.dates.map(date => ({ title: `${finalTitle} – ${r.title.trim() || finalTitle}`, date })))
    );
    setSaving(false);
    if (ok) {
      celebrateAssignment();
      track('homework_planned_by_child', { parts: rows.length, sessions: sessionCount, edited });
      if (homeworkType === 'forhor') {
        track('study_techniques_used', {
          count: rows.length,
          sessions: sessionCount,
          subject,
          flow: 'child',
        });
      }
      setInitialisedFor(null);
      onClose();
    }
  };

  return (
    <Dialog open={!!homework} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {SUBJECT_ICONS[subject]} {finalTitle}
          </DialogTitle>
          <DialogDescription>
            Fyll i det som saknas och välj vilka dagar du gör vad.
          </DialogDescription>
        </DialogHeader>

        {homework.description && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">{homework.description}</p>
        )}

        <div className="space-y-5 pt-2">
          {/* Editable details */}
          <div className="space-y-4 rounded-2xl border border-border p-3">
            <div className="space-y-2">
              <Label htmlFor="plan-title">Vad är läxan?</Label>
              <Input
                id="plan-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={`t.ex. ${SUBJECT_LABELS[subject]} kap 4`}
              />
            </div>

            <div className="space-y-2">
              <Label>Ämne</Label>
              <div className="grid grid-cols-4 gap-2">
                {subjects.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={cn(
                      'py-2 rounded-xl border-2 text-xs font-medium transition-colors',
                      subject === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    )}
                  >
                    <span className="block text-base">{SUBJECT_ICONS[s]}</span>
                    {SUBJECT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Typ</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['inlamning', 'forhor'] as HomeworkType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHomeworkType(t)}
                    className={cn(
                      'py-2 rounded-xl border-2 text-sm font-medium transition-colors',
                      homeworkType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    )}
                  >
                    {HOMEWORK_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {!dueDateKnown && (
                <p className="text-xs font-medium text-warning bg-warning/10 rounded-xl p-2">
                  När ska den vara klar? Välj ett datum för att kunna planera.
                </p>
              )}
              <Label htmlFor="plan-due">Deadline</Label>
              <Input
                id="plan-due"
                type="date"
                value={dueDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-note">Egen anteckning (valfritt)</Label>
              <Input
                id="plan-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="t.ex. sidor 12–18"
              />
            </div>
          </div>

          <p className="text-xs font-medium text-primary">
            {rows.length} moment · {sessionCount} pluggtillfälle{sessionCount === 1 ? '' : 'n'}
          </p>
          <p className="text-xs text-muted-foreground">
            Tips: repetera samma moment på två dagar – det ger bäst effekt.
          </p>
          {rows.map((row, i) => (
            <div key={row.id} className="space-y-2 rounded-xl border border-border p-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <Input
                  value={row.title}
                  onChange={e => renameRow(i, e.target.value)}
                  aria-label={`Namn på moment ${i + 1}`}
                  className="flex-1 h-9"
                />
                <button
                  type="button"
                  aria-label="Flytta upp"
                  disabled={i === 0}
                  onClick={() => moveRow(i, -1)}
                  className="text-muted-foreground hover:text-primary disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Flytta ner"
                  disabled={i === rows.length - 1}
                  onClick={() => moveRow(i, 1)}
                  className="text-muted-foreground hover:text-primary disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                {rows.length > 1 && (
                  <button
                    type="button"
                    aria-label="Ta bort del"
                    onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {days.length === 0 && (
                <p className="text-xs text-warning">Välj deadline ovan för att se dagarna.</p>
              )}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const selected = row.dates.includes(dateStr);
                  const hwCount = taskCountsByDate[dateStr] || 0;
                  const acts = getActivitiesForDate(homework.child_id, day);
                  const busy = hwCount + acts.length;
                  const dotClass = busy === 0 ? 'bg-success' : busy <= 2 ? 'bg-warning' : 'bg-destructive';
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => toggleRowDate(i, dateStr)}
                      className={cn(
                        'shrink-0 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : busy >= 3
                            ? 'border-destructive/40 text-muted-foreground'
                            : 'border-border text-muted-foreground'
                      )}
                    >
                      <span className="block">{format(day, 'EEE', { locale: sv })}</span>
                      <span className="block text-sm font-bold">{format(day, 'd/M')}</span>
                      <span className="flex items-center justify-center gap-1 mt-0.5 text-[10px]">
                        <span className={cn('w-1.5 h-1.5 rounded-full', dotClass)} />
                        {hwCount}
                        {acts.length > 0 && <span>{acts.map(a => a.emoji || '📌').join('')}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className={cn('text-[10px]', row.dates.length === 0 ? 'text-destructive' : 'text-muted-foreground')}>
                {row.dates.length === 0
                  ? 'Välj minst en dag'
                  : `${row.dates.length} dag${row.dates.length === 1 ? '' : 'ar'} vald${row.dates.length === 1 ? '' : 'a'}`}
              </p>
            </div>
          ))}

          {studyTechniqueSuggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Förslag på delar</Label>
              <div className="flex flex-wrap gap-2">
                {studyTechniqueSuggestions.map(t => {
                  const added = rows.some(r => r.title === t.label);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={added}
                      onClick={() => setRows(prev => [...prev, { id: crypto.randomUUID(), title: t.label, dates: [] }])}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                        added
                          ? 'bg-muted text-muted-foreground border-border opacity-60'
                          : 'bg-background border-primary/30 hover:border-primary hover:bg-primary/5'
                      )}
                      title={t.description}
                    >
                      <span className="mr-1">{t.icon}</span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="plan-new">Lägg till egen del</Label>
            <div className="flex gap-2">
              <Input
                id="plan-new"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRow();
                  }
                }}
                placeholder="t.ex. Repetera glosor"
              />
              <Button type="button" variant="secondary" onClick={addRow} aria-label="Lägg till del">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || !canSave} className="w-full" size="lg">
            <CalendarCheck className="w-4 h-4 mr-2" />
            {saving ? 'Sparar…' : 'Klart – planera!'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {SUBJECT_LABELS[subject]} · {rows.filter(r => r.dates.length > 0).length}/{rows.length} delar planerade
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
