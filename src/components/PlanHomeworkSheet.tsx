import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfDay, eachDayOfInterval, isBefore } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarCheck, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useFamily } from '@/hooks/useFamily';
import { celebrateAssignment } from '@/lib/confetti';
import { track } from '@/lib/analytics';
import { SUBJECT_LABELS, SUBJECT_ICONS, HOMEWORK_TYPE_LABELS, Subject, HomeworkType } from '@/types/homework';
import { buildSuggestedPlan, getStudyTechniqueSuggestions } from '@/lib/studyTechniques';
import type { InboxHomework } from '@/hooks/queries/useHomeworkData';
import { StudyPlanningModeChoice, type StudyPlanningMode } from '@/components/StudyPlanningModeChoice';
import { DayLoadIndicator } from '@/components/DayLoadIndicator';
import { StudyPlanTemplate, type StudyPlanRow } from '@/components/StudyPlanTemplate';

interface PlanHomeworkSheetProps {
  homework: InboxHomework | null;
  onClose: () => void;
}

const subjects: Subject[] = ['math', 'science', 'language', 'history', 'art', 'music', 'english', 'other'];

export function PlanHomeworkSheet({ homework, onClose }: PlanHomeworkSheetProps) {
  const { planHomework, updateHomework, homework: allHomework, getActivitiesForDate } = useFamily();
  const [rows, setRows] = useState<StudyPlanRow[]>([]);
  const [planningMode, setPlanningMode] = useState<StudyPlanningMode | null>(null);
  const [manualDays, setManualDays] = useState<string[]>([]);
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
    let base: StudyPlanRow[] = [];
    if (homework.planItems.length > 0) {
      base = homework.planItems.map(item => ({ id: crypto.randomUUID(), title: item.title, dates: [] }));
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
    setPlanningMode(null);
    setManualDays([]);
    setInitialisedFor(homework.id);
  }

  if (!homework) return null;

  const finalTitle = title.trim() || SUBJECT_LABELS[subject];
  const isTemplate = homeworkType === 'forhor' && planningMode === 'template';
  const isManualExam = homeworkType === 'forhor' && planningMode === 'manual';
  const allPlanned = isTemplate
    ? rows.length > 0 && rows.every(row => row.dates.length > 0)
    : manualDays.length > 0;
  const sessionCount = isTemplate ? rows.reduce((sum, row) => sum + row.dates.length, 0) : manualDays.length;
  const canSave = allPlanned && !!dueDate && (homeworkType !== 'forhor' || planningMode !== null);
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
      !isTemplate
        ? manualDays.map(date => ({ title: finalTitle, date }))
        : rows.flatMap(r => r.dates.map(date => ({ title: `${finalTitle} – ${r.title.trim() || finalTitle}`, date })))
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
          phases: [...new Set(rows
            .map(row => studyTechniqueSuggestions.find(s => s.label === row.title)?.phase)
            .filter(Boolean))].join(','),
        });
      }
      setInitialisedFor(null);
      onClose();
    }
  };

  return (
    <Dialog open={!!homework} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn(
        'max-h-[90vh] overflow-y-auto',
        isTemplate
          ? 'h-[100dvh] max-h-[100dvh] w-screen max-w-none rounded-none sm:h-[94vh] sm:max-h-[94vh] sm:w-[96vw] sm:max-w-6xl sm:rounded-lg'
          : 'max-w-md md:max-w-2xl'
      )}>
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
                     onClick={() => {
                       setHomeworkType(t);
                       setPlanningMode(null);
                       setManualDays([]);
                     }}
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

          {homeworkType === 'forhor' && (
            <StudyPlanningModeChoice
              value={planningMode}
              collapsible
              onReset={() => setPlanningMode(null)}
              onChange={mode => {
                setPlanningMode(mode);
                if (mode === 'template' && !rows.some(row => row.dates.length > 0)) {
                  setRows(buildSuggestedPlan(days, studyTechniqueSuggestions));
                }
              }}
            />
          )}

          {isTemplate && (
            <StudyPlanTemplate
              days={days}
              rows={rows}
              onRowsChange={setRows}
              suggestions={studyTechniqueSuggestions}
              taskCountsByDate={taskCountsByDate}
              getActivitiesForDay={day => getActivitiesForDate(homework.child_id, day)}
            />
          )}

          {!isTemplate && (homeworkType !== 'forhor' || isManualExam) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><p className="font-medium">Välj pluggdagar</p></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {days.map(day => {
                  const date = format(day, 'yyyy-MM-dd');
                  const selected = manualDays.includes(date);
                  const homeworkCount = taskCountsByDate[date] || 0;
                  const activities = getActivitiesForDate(homework.child_id, day);
                  return (
                    <Button key={date} type="button" variant="outline" onClick={() => setManualDays(previous => previous.includes(date) ? previous.filter(item => item !== date) : [...previous, date].sort())} className={cn('h-auto min-h-20 justify-start p-3 text-left', selected && 'border-primary bg-primary/10 ring-1 ring-primary')}>
                      <span className="flex w-full items-center gap-3">
                        <span className="min-w-12"><span className="block text-xs capitalize text-muted-foreground">{format(day, 'EEE', { locale: sv })}</span><span className="font-bold">{format(day, 'd MMM', { locale: sv })}</span></span>
                        <span className="min-w-0 flex-1"><DayLoadIndicator homeworkCount={homeworkCount} activities={activities} /></span>
                        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2', selected && 'border-primary bg-primary text-primary-foreground')}>{selected && <Check className="h-3.5 w-3.5" />}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted-foreground">Grön = lugn dag · Gul = några läxor · Röd = full dag</p>
            </div>
          )}

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
