import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Camera, Mic, MicOff, Send, Loader2, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SUBJECT_LABELS, SUBJECT_ICONS, type Subject, type HomeworkType } from '@/types/homework';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { toast } from 'sonner';

export interface AIHomeworkCard {
  title: string | null;
  subject: Subject | null;
  homework_type: HomeworkType | null;
  due_date: string | null;
  description: string | null;
  bring_items: string[];
  study_sessions: number | null;
  study_plan: { title: string; date: string }[];
  question: string | null;
  quick_replies: string[];
  ready: boolean;
}

type Msg = { role: 'user' | 'assistant'; text: string; image?: string };

interface Props {
  busyDates: string[];
  onApply: (card: AIHomeworkCard) => void;
}

async function downscale(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const max = 1400;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const fmtDate = (d: string) => {
  try { return format(parseISO(d), 'EEE d MMM', { locale: sv }); } catch { return d; }
};

export function AIHomeworkAssistant({ busyDates, onApply }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [card, setCard] = useState<AIHomeworkCard | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const baseTextRef = useRef('');
  const fileRef = useRef<HTMLInputElement>(null);

  const SpeechRec = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  useEffect(() => () => recRef.current?.abort?.(), []);

  const send = async (text: string, image?: string) => {
    if (!text.trim() && !image) return;
    if (listening) stopListening();
    const next: Msg[] = [...messages, { role: 'user', text: text.trim() || 'Här är en bild på läxan.', image }];
    setMessages(next);
    setInput('');
    setLoading(true);
    const now = new Date();
    const { data, error } = await supabase.functions.invoke('homework-assistant', {
      body: {
        messages: next,
        current: card,
        today: format(now, 'yyyy-MM-dd'),
        weekday: format(now, 'EEEE', { locale: sv }),
        busyDates,
      },
    });
    setLoading(false);
    if (error || !data?.card) {
      let msg = 'Assistenten kunde inte svara. Försök igen.';
      if (error instanceof FunctionsHttpError) {
        try { msg = (await error.context.json()).error ?? msg; } catch { /* ignore */ }
      }
      toast.error(msg);
      setMessages(messages);
      return;
    }
    const c = data.card as AIHomeworkCard;
    setCard(c);
    track('ai_homework_turn', { has_image: !!image, ready: c.ready });
    // Drop image payloads from history after first send to keep requests small
    setMessages([...next.map(m => ({ role: m.role, text: m.text })), { role: 'assistant', text: c.question ?? 'Klart!' }]);
  };

  const startListening = () => {
    if (!SpeechRec) {
      toast('Tryck på mikrofonen på tangentbordet för att prata in texten.');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'sv-SE';
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = input ? input + ' ' : '';
    rec.onresult = (e: any) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(baseTextRef.current + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopListening = () => {
    recRef.current?.stop?.();
    setListening(false);
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const img = await downscale(file);
      await send(input, img);
    } catch {
      toast.error('Kunde inte läsa bilden');
    }
  };

  const reset = () => { setMessages([]); setCard(null); setInput(''); };

  const lastQuestion = messages.length && messages[messages.length - 1].role === 'assistant'
    ? messages[messages.length - 1].text : null;

  return (
    <div className="space-y-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">✨ Berätta om läxan</p>
          <p className="text-xs text-muted-foreground">
            Prata fritt eller fota läxpappret – assistenten fyller i och frågar om det som saknas.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={reset} aria-label="Börja om">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {card && (card.title || card.due_date || card.subject) && (
        <div className="rounded-xl bg-card p-3 shadow-sm space-y-1.5 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <span>{card.subject ? SUBJECT_ICONS[card.subject] : '📝'}</span>
            <span>{card.title ?? 'Läxa'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {card.subject && <span className="rounded-full bg-muted px-2 py-0.5">{SUBJECT_LABELS[card.subject]}</span>}
            {card.homework_type && (
              <span className="rounded-full bg-muted px-2 py-0.5">{card.homework_type === 'forhor' ? 'Förhör / prov' : 'Inlämning'}</span>
            )}
            {card.due_date && <span className="rounded-full bg-primary/15 px-2 py-0.5 font-medium">📅 {fmtDate(card.due_date)}</span>}
          </div>
          {card.description && <p className="text-xs text-muted-foreground">{card.description}</p>}
          {card.study_plan.length > 0 && (
            <ul className="space-y-1 pt-1">
              {card.study_plan.map((p, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="w-20 shrink-0 font-medium capitalize">{fmtDate(p.date)}</span>
                  <span>{p.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {lastQuestion && !loading && (
        <p className="rounded-xl bg-card/70 px-3 py-2 text-sm">💬 {lastQuestion}</p>
      )}

      {card?.quick_replies?.length && !loading ? (
        <div className="flex flex-wrap gap-2">
          {card.quick_replies.map(r => (
            <Button key={r} size="sm" variant="outline" className="rounded-full" onClick={() => send(r)}>{r}</Button>
          ))}
        </div>
      ) : null}

      {card?.ready && !loading && (
        <Button className="w-full" onClick={() => { track('ai_homework_applied', { type: card.homework_type ?? '' }); onApply(card); }}>
          <Check className="mr-1 h-4 w-4" /> Använd och granska
        </Button>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={messages.length ? 'Svara här…' : 't.ex. "Alvar har prov i geografi om Norden nästa torsdag"'}
          rows={2}
          className="min-h-[44px] flex-1 resize-none bg-card"
          disabled={loading}
        />
        <div className="flex flex-col gap-1.5">
          <Button
            size="icon"
            variant={listening ? 'destructive' : 'secondary'}
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            aria-label={listening ? 'Sluta lyssna' : 'Prata'}
            className={cn(listening && 'animate-pulse')}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="secondary" onClick={() => fileRef.current?.click()} disabled={loading} aria-label="Fota läxan">
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <Button size="icon" onClick={() => send(input)} disabled={loading || !input.trim()} aria-label="Skicka">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
      <p className="text-center text-[11px] text-muted-foreground">Eller fyll i själv nedan 👇</p>
    </div>
  );
}
