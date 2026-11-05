import { useNavigate } from 'react-router-dom';
import { Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** First-run nudge: shows the Pluggcoach instead of an empty day. */
export function PluggcoachStartCard({ childName }: { childName?: string }) {
  const navigate = useNavigate();
  const go = () => navigate('/add?ny=1');
  return (
    <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3" aria-label="Testa Pluggcoachen">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <p className="font-semibold">Testa Pluggcoachen på 20 sekunder</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Har {childName ?? 'ditt barn'} ett prov eller glosor på gång? Berätta med rösten, ta ett kort på läxan eller skriv – så lägger coachen upp lagom pluggpass under veckan.
      </p>
      <div className="flex flex-wrap gap-2">
        {['Glosor på fredag', 'NO-prov nästa vecka', 'Läsläxa'].map((s) => (
          <button key={s} onClick={go} className="text-xs rounded-full border border-primary/30 bg-card px-3 py-1.5 hover:bg-primary/10">{s}</button>
        ))}
      </div>
      <Button onClick={go} className="w-full"><Mic className="w-4 h-4 mr-2" />Berätta om en läxa</Button>
    </section>
  );
}
