import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChildLike {
  id: string;
  name: string;
  has_account?: boolean | null;
}

interface Props {
  children: ChildLike[];
  homeworkCount: number;
  onAddChild: () => void;
}

/**
 * Shown to parents until the basics are in place. New families tended to stop
 * right after adding a child, so we spell out the remaining steps.
 */
export function GettingStartedCard({ children, homeworkCount, onAddChild }: Props) {
  const navigate = useNavigate();

  const { isSubscribed, loading: notificationsLoading } = useNotifications();

  // A stored subscription counts as "on" even on a device where the browser
  // permission prompt was never shown.
  const notificationsOn =
    isSubscribed ||
    (typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted');

  const steps = useMemo(
    () => [
      {
        key: 'child',
        label: 'Lägg till ditt barn',
        hint: 'Alla läxor och packlistor hänger på barnet.',
        done: children.length > 0,
        action: onAddChild,
        cta: 'Lägg till barn',
      },
      {
        key: 'account',
        label: 'Skapa inloggning till barnet',
        hint: 'Då kan barnet bocka av själv – och du ser framstegen.',
        done: children.some((c) => !!c.has_account),
        action: () => navigate('/family'),
        cta: 'Skapa inloggning',
      },
      {
        key: 'notifications',
        label: 'Slå på påminnelser',
        hint: 'Små puffar på eftermiddagen istället för tjat.',
        done: notificationsOn,
        action: () => navigate('/family'),
        cta: 'Slå på',
      },
      {
        key: 'homework',
        label: 'Lägg in första läxan',
        hint: 'Vi delar upp den i lagom stora pluggdagar.',
        done: homeworkCount > 0,
        action: () => navigate('/add'),
        cta: 'Lägg in läxa',
      },
    ],
    [children, homeworkCount, notificationsOn, navigate, onAddChild],
  );

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const next = steps.find((s) => !s.done)!;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border-2 border-primary/20 p-4 space-y-3 shadow-card"
      aria-label="Kom igång"
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Kom igång</p>
          <p className="text-xs text-muted-foreground">
            {doneCount} av {steps.length} klara
          </p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            {s.done ? (
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <p className={cn('text-sm', s.done && 'text-muted-foreground line-through')}>
                {s.label}
              </p>
              {!s.done && s.key === next.key && (
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Button onClick={next.action} className="w-full">
        {next.cta}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.section>
  );
}
