import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AdminStats {
  totals: {
    users: number;
    families: number;
    children: number;
    child_accounts: number;
    homework: number;
    completed_tasks: number;
  };
  this_month: Record<string, number>;
  prev_month: Record<string, number>;
  active: {
    users_7d: number;
    users_30d: number;
    users_prev_30d: number;
    children_7d: number;
    children_30d: number;
  };
  months: { month: string; families: number; users: number; homework: number; logins: number }[];
  recent_families: {
    id: string;
    name: string;
    created_at: string;
    children: number;
    child_accounts: number;
    homework: number;
    last_child_seen: string | null;
  }[];
}

function Delta({ now, prev }: { now: number; prev: number }) {
  const diff = now - prev;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : ArrowRight;
  const color =
    diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {diff > 0 ? '+' : ''}
      {diff} mot förra månaden
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  now,
  prev,
}: {
  label: string;
  value: number;
  sub?: string;
  now?: number;
  prev?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {now !== undefined && prev !== undefined && <Delta now={now} prev={prev} />}
      </CardContent>
    </Card>
  );
}

interface HelpQuestion {
  id: string;
  email: string | null;
  message: string;
  answered: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      return data as unknown as AdminStats;
    },
    staleTime: 60 * 1000,
  });

  const { data: questions } = useQuery({
    queryKey: ['admin-help-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_questions')
        .select('id, email, message, answered, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as HelpQuestion[];
    },
    staleTime: 60 * 1000,
  });

  const monthData =
    data?.months.map(m => ({
      ...m,
      label: format(parseISO(`${m.month}-01`), 'MMM', { locale: sv }),
    })) ?? [];

  return (
    <AppShell>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg safe-area-top">
        <div className="px-4 py-4 md:px-8">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">Översikt över hela Läxhjälp</p>
        </div>
      </header>

      <main className="space-y-6 px-4 py-4 md:px-8 md:py-6">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">Kunde inte hämta statistiken just nu.</p>
        )}

        {data && (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Användare"
                value={data.totals.users}
                sub={`${data.this_month.users} nya denna månad`}
                now={data.this_month.users}
                prev={data.prev_month.users}
              />
              <StatCard
                label="Familjer"
                value={data.totals.families}
                sub={`${data.this_month.families} nya denna månad`}
                now={data.this_month.families}
                prev={data.prev_month.families}
              />
              <StatCard
                label="Barn"
                value={data.totals.children}
                sub={`${data.totals.child_accounts} har eget konto`}
                now={data.this_month.children}
                prev={data.prev_month.children}
              />
              <StatCard
                label="Läxor"
                value={data.totals.homework}
                sub={`${data.this_month.homework} nya denna månad`}
                now={data.this_month.homework}
                prev={data.prev_month.homework}
              />
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Aktiva senaste 7 dagarna"
                value={data.active.users_7d}
                sub="inloggade konton"
              />
              <StatCard
                label="Aktiva senaste 30 dagarna"
                value={data.active.users_30d}
                sub="inloggade konton"
                now={data.active.users_30d}
                prev={data.active.users_prev_30d}
              />
              <StatCard
                label="Aktiva barn (7 dagar)"
                value={data.active.children_7d}
                sub={`${data.active.children_30d} senaste 30 dagarna`}
              />
              <StatCard
                label="Avbockade pluggmoment"
                value={data.totals.completed_tasks}
                sub={`${data.this_month.completed_tasks} denna månad`}
                now={data.this_month.completed_tasks}
                prev={data.prev_month.completed_tasks}
              />
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trend – senaste 6 månaderna</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar name="Nya familjer" dataKey="families" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar name="Nya läxor" dataKey="homework" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    <Bar name="Inloggningar" dataKey="logins" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Senaste frågorna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions && questions.length > 0 ? (
                  questions.map(q => (
                    <div
                      key={q.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{q.email ?? 'Okänd användare'}</p>
                        <p className="text-sm text-muted-foreground">{q.message}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {!q.answered && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            Obesvarad
                          </span>
                        )}
                        <span>
                          {format(parseISO(q.created_at), 'd MMM yyyy', { locale: sv })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Inga hjälpfrågor ännu – nya användares frågor dyker upp här.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Senaste familjerna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recent_families.map(f => (
                  <div
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 p-3"
                  >
                    <div>
                      <p className="font-semibold">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Skapad {format(parseISO(f.created_at), 'd MMM yyyy', { locale: sv })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{f.children} barn</span>
                      <span>{f.child_accounts} barnkonto</span>
                      <span>{f.homework} läxor</span>
                      <span>
                        {f.last_child_seen
                          ? `Barn aktivt ${format(parseISO(f.last_child_seen), 'd MMM', { locale: sv })}`
                          : 'Barn aldrig aktivt'}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </AppShell>
  );
}
