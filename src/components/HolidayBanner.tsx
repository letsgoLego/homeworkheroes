import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Palmtree } from 'lucide-react';
import { useHolidayMode } from '@/hooks/useHolidayMode';

export function HolidayBanner({ childId }: { childId: string | null }) {
  const { isActive, mode } = useHolidayMode(childId);
  if (!childId || !isActive) return null;

  return (
    <Link
      to="/week"
      className="block rounded-2xl bg-gradient-to-r from-celebration/20 via-celebration/15 to-accent/20 border-2 border-celebration/40 p-4 hover:opacity-95 transition"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-celebration/30 flex items-center justify-center text-2xl">
          🌴
        </div>
        <div className="flex-1">
          <div className="font-bold flex items-center gap-2">
            <Palmtree className="w-4 h-4" />
            Lovläge aktivt
          </div>
          <div className="text-xs text-muted-foreground">
            {mode?.ends_at
              ? `T.o.m. ${format(new Date(mode.ends_at), 'd MMM', { locale: sv })}`
              : 'Pågående'}
            {' · '}Tryck för dina lovmål
          </div>
        </div>
      </div>
    </Link>
  );
}
