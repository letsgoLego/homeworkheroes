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
  const [transcribing, setTranscribing] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    if (!loading && messages.length) inputRef.current?.focus({ preventScroll: true });
  }, [messages, loading, card]);

  useEffect(() => () => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // Låt textrutan växa med innehållet så man kan se och scrolla i det man pratat in
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

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
        messages: next.map((m, i) => (i === next.length - 1 ? m : { role: m.role, text: m.text })),
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
    setMessages([...next, { role: 'assistant', text: c.question ?? (c.ready ? 'Klart! Allt är ifyllt.' : 'Berätta gärna mer.') }]);
  };

  const transcribe = async (blob: Blob, mimeType: string) => {
    setTranscribing(true);
    try {
      const buf = await blob.arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const { data, error } = await supabase.functions.invoke('homework-assistant', {
        body: { action: 'transcribe', audio: btoa(bin), mimeType },
      });
      if (error || !data?.text) {
        let msg = 'Kunde inte tolka ljudet. Försök igen.';
        if (error instanceof FunctionsHttpError) {
          try { msg = (await error.context.json()).error ?? msg; } catch { /* ignore */ }
        }
        toast.error(msg);
        return;
      }
      setInput(prev => (prev ? prev.trimEnd() + ' ' : '') + data.text);
      track('ai_homework_transcribed', { chars: data.text.length });
    } catch {
      toast.error('Kunde inte tolka ljudet. Försök igen.');
    } finally {
      setTranscribing(false);
    }
  };

  const startListening = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast('Tryck på mikrofonen på tangentbordet för att prata in texten.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
        .find(m => MediaRecorder.isTypeSupported(m)) ?? '';
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        chunksRef.current = [];
        if (blob.size > 500) transcribe(blob, blob.type);
      };
      recRef.current = rec;
      rec.start(250);
      setListening(true);
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') {
        toast.error('Mikrofonen är blockerad. Tillåt mikrofonen i webbläsarens inställningar.');
      } else {
        toast.error('Kunde inte starta mikrofonen.');
      }
    }
  };

  const stopListening = () => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    recRef.current = null;
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

  const lastIdx = messages.length - 1;
  const showCard = card && (card.title || card.due_date || card.subject);

  const cardView = showCard && card ? (
    <div className="rounded-xl border bg-card p-3 shadow-sm space-y-1.5 text-sm">
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
  ) : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between gap-2 border-b border-primary/20 px-4 py-2.5">
        <div>
          <p className="font-bold">🦉 Pluggcoachen</p>
          <p className="text-xs text-muted-foreground">Grundad i läroplanen – prata, skriv eller fota.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={reset} aria-label="Börja om">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex min-h-[45vh] max-h-[60vh] flex-col gap-2.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="flex gap-2">
            <span className="text-lg leading-none">🦉</span>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-3 py-2 text-sm shadow-sm">
              Hej! Berätta om läxan med 🎙️, skriv, eller fota läxpappret med 📷. Jag frågar om det som saknas.
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Prov i engelska på fredag', 'Glosor till tisdag', 'Matteläxa sid 34'].map(r => (
                  <Button key={r} size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={() => send(r)}>{r}</Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => m.role === 'user' ? (
          <div key={i} className="flex justify-end">
            <div className="max-w-[85%] space-y-1.5 rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              {m.image && <img src={m.image} alt="Läxbild" className="max-h-40 rounded-lg" />}
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ) : (
          <div key={i} className="flex gap-2">
            <span className="text-lg leading-none">🦉</span>
            <div className="max-w-[85%] flex-1 space-y-2">
              {i === lastIdx && cardView}
              <p className="text-sm">{m.text}</p>
              {i === lastIdx && !loading && card?.quick_replies?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {card.quick_replies.map(r => (
                    <Button key={r} size="sm" variant="outline" className="h-8 rounded-full" onClick={() => send(r)}>{r}</Button>
                  ))}
                </div>
              ) : null}
              {i === lastIdx && card?.ready && !loading && (
                <Button className="w-full" onClick={() => { track('ai_homework_applied', { type: card.homework_type ?? '' }); onApply(card); }}>
                  <Check className="mr-1 h-4 w-4" /> Använd och granska
                </Button>
              )}
              {i === lastIdx && !loading && (
                <p className="text-xs text-muted-foreground">
                  {card?.ready
                    ? 'Vill du ändra något? Prata 🎙️ eller skriv, t.ex. "flytta provet till fredag".'
                    : 'Svara med 🎙️ eller skriv – jag fyller i kortet ovan.'}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg leading-none">🦉</span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-primary/20 bg-card/60 p-2">
        {listening && <p className="pb-1.5 text-center text-xs font-medium text-destructive">● Lyssnar… tryck igen när du är klar</p>}
        {transcribing && <p className="pb-1.5 text-center text-xs text-muted-foreground">Tolkar det du sa…</p>}
        <div className="flex items-end gap-1.5">
          <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} disabled={loading} aria-label="Fota läxan" className="shrink-0">
            <Camera className="h-5 w-5" />
          </Button>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={messages.length ? 'Prata 🎙️ eller skriv ditt svar…' : 'Skriv eller prata…'}
            rows={1}
            className="min-h-[44px] max-h-40 flex-1 resize-none overflow-y-auto bg-card py-2.5"
            disabled={loading}
          />
          {input.trim() ? (
            <Button size="icon" onClick={() => send(input)} disabled={loading} aria-label="Skicka" className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          ) : (
            <Button
              size="icon"
              variant={listening ? 'destructive' : 'default'}
              onClick={listening ? stopListening : startListening}
              disabled={loading || transcribing}
              aria-label={listening ? 'Sluta lyssna' : 'Prata'}
              className={cn('shrink-0', listening && 'animate-pulse')}
            >
              {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
      <p className="pb-2 text-center text-[11px] text-muted-foreground">Eller fyll i själv nedan 👇</p>
    </div>
  );
}
