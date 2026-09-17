import { format } from 'date-fns';
import type { HomeworkType, Subject } from '@/types/homework';

/**
 * Studieteknikerna bygger på de forskningssammanställningar som Skolverket sprider:
 * testbaserat lärande (retrieval practice), spridd repetition, interfoliering
 * (att blanda områden) samt självreglering – att planera, genomföra och utvärdera.
 */
export type StudyPhase = 'understand' | 'practice' | 'review';

export const STUDY_PHASE_LABELS: Record<StudyPhase, string> = {
  understand: 'Förstå',
  practice: 'Träna',
  review: 'Repetera',
};

export const STUDY_PHASE_HINTS: Record<StudyPhase, string> = {
  understand: 'Skapa en överblick och egna ord för innehållet.',
  practice: 'Testa dig själv – det är tekniken som ger mest.',
  review: 'Blanda och repetera med mellanrum, nära provet.',
};

export interface StudyTechnique {
  id: string;
  label: string;
  description: string;
  /** Kort forskningsbaserad förklaring i barnvänligt språk. */
  why: string;
  phase: StudyPhase;
  icon?: string;
  subjects?: Subject[];
}

const PHASE_ORDER: StudyPhase[] = ['understand', 'practice', 'review'];

export const GENERAL_TECHNIQUES: StudyTechnique[] = [
  {
    id: 'read-through',
    label: 'Läsa igenom',
    description: 'Läs igenom materialet och markera nyckelord.',
    why: 'Du behöver en överblick innan du kan träna på detaljerna.',
    phase: 'understand',
    icon: '👁️',
  },
  {
    id: 'summarise',
    label: 'Sammanfatta med egna ord',
    description: 'Skriv korta egna sammanfattningar.',
    why: 'Att formulera om innehållet med egna ord visar vad du faktiskt förstått.',
    phase: 'understand',
    icon: '✍️',
  },
  {
    id: 'mind-map',
    label: 'Tankekarta',
    description: 'Rita upp samband mellan begreppen.',
    why: 'Bilder och samband gör att fakta hänger ihop i minnet.',
    phase: 'understand',
    icon: '🕸️',
  },
  {
    id: 'self-test',
    label: 'Testa dig själv utan att titta',
    description: 'Stäng boken och skriv eller säg allt du minns.',
    why: 'Att försöka minnas är effektivare än att läsa om – och du kommer ihåg längre.',
    phase: 'practice',
    icon: '🧠',
  },
  {
    id: 'mini-test',
    label: 'Gör delförhör',
    description: 'Testa ett litet område i taget, gärna med hjälp av någon.',
    why: 'Små förhör visar vad du redan kan och vad du behöver träna mer på.',
    phase: 'practice',
    icon: '📝',
  },
  {
    id: 'fill-in-blanks',
    label: 'Lucktext',
    description: 'Täck över delar av texten och fyll i orden.',
    why: 'När du plockar fram ordet ur minnet stärks minnesspåret.',
    phase: 'practice',
    icon: '🔲',
  },
  {
    id: 'mnemonics',
    label: 'Minnesregel',
    description: 'Skapa en ramsa, bild eller association.',
    why: 'Minnesregler ger hjärnan en extra krok att hänga upp fakta på.',
    phase: 'practice',
    icon: '🎭',
  },
  {
    id: 'interleave',
    label: 'Blanda gamla och nya delar',
    description: 'Växla mellan olika områden i stället för ett i taget.',
    why: 'Blandad träning känns svårare men fastnar bättre på lång sikt.',
    phase: 'review',
    icon: '🔀',
  },
  {
    id: 'explain-to-someone',
    label: 'Förklara för någon',
    description: 'Förklara högt för en förälder eller kompis.',
    why: 'När du förklarar märker du själv var luckorna finns.',
    phase: 'review',
    icon: '🗣️',
  },
  {
    id: 'final-check',
    label: 'Sista koll – vad är svårast?',
    description: 'Gå igenom det som känns svårast strax innan provet.',
    why: 'Att utvärdera vad du kan gör att du lägger tiden där den behövs mest.',
    phase: 'review',
    icon: '🎯',
  },
];

export const SUBJECT_TECHNIQUES: StudyTechnique[] = [
  {
    id: 'math-old-problems',
    label: 'Räkna gamla uppgifter',
    description: 'Räkna liknande uppgifter igen, utan att titta på lösningen.',
    why: 'Att räkna själv är samma sak som att testa sig – det ger mest effekt i matte.',
    phase: 'practice',
    icon: '📐',
    subjects: ['math'],
  },
  {
    id: 'math-formulas',
    label: 'Skriv formler för hand',
    description: 'Skriv upp formlerna ur minnet.',
    why: 'Att skriva ur minnet befäster kunskapen bättre än att läsa formeln.',
    phase: 'practice',
    icon: '🖊️',
    subjects: ['math'],
  },
  {
    id: 'math-mixed-practice',
    label: 'Blanda uppgiftstyper',
    description: 'Varva olika sorters tal i samma pass.',
    why: 'Blandad träning gör att du känner igen vilken metod som passar.',
    phase: 'review',
    icon: '🧮',
    subjects: ['math'],
  },
  {
    id: 'language-vocab',
    label: 'Repetera glosor',
    description: 'Gå igenom glosorna flera korta gånger under veckan.',
    why: 'Ord behöver många upprepningar med mellanrum för att sitta.',
    phase: 'practice',
    icon: '🔤',
    subjects: ['english'],
  },
  {
    id: 'language-vocab-test',
    label: 'Gör glosförhör',
    description: 'Låt någon testa dig på glosorna.',
    why: 'Förhör visar direkt vilka ord du behöver träna mer på.',
    phase: 'practice',
    icon: '🎤',
    subjects: ['english'],
  },
  {
    id: 'language-read-aloud',
    label: 'Läs högt',
    description: 'Läs texten högt för dig själv eller någon annan.',
    why: 'Att höra sig själv tränar uttal och förståelse samtidigt.',
    phase: 'understand',
    icon: '📢',
    subjects: ['english', 'language'],
  },
  {
    id: 'language-writing',
    label: 'Skriv stilövning',
    description: 'Öva på att formulera dig skriftligt i ämnet.',
    why: 'Du övar på det du faktiskt ska göra på provet.',
    phase: 'practice',
    icon: '📜',
    subjects: ['language'],
  },
  {
    id: 'language-grammar',
    label: 'Repetera grammatik',
    description: 'Gå igenom regler för ordklasser och satsdelar.',
    why: 'Regler är färdigheter – de behöver upprepas många gånger.',
    phase: 'practice',
    icon: '🏗️',
    subjects: ['language'],
  },
  {
    id: 'science-facts',
    label: 'Sammanfatta fakta',
    description: 'Samla viktiga fakta i en egen faktabank.',
    why: 'Att sortera fakta med egna ord gör dem lättare att minnas.',
    phase: 'understand',
    icon: '📋',
    subjects: ['science', 'history'],
  },
  {
    id: 'science-concept-map',
    label: 'Gör begreppskarta',
    description: 'Visa hur begreppen hänger ihop i ett diagram.',
    why: 'Samband mellan begrepp gör att du kan förklara, inte bara rabbla.',
    phase: 'understand',
    icon: '🗺️',
    subjects: ['science', 'history'],
  },
];

/**
 * Förslag i forskningsordning: Förstå → Träna → Repetera.
 * Ämnesspecifika tekniker går före generella inom varje fas.
 */
export function getStudyTechniqueSuggestions(
  subject: Subject,
  homeworkType: HomeworkType
): StudyTechnique[] {
  if (homeworkType !== 'forhor') return [];

  const subjectSpecific = SUBJECT_TECHNIQUES.filter(
    t => !t.subjects || t.subjects.includes(subject)
  );
  const existingIds = new Set(subjectSpecific.map(t => t.id));
  const generics = GENERAL_TECHNIQUES.filter(t => !existingIds.has(t.id));
  const all = [...subjectSpecific, ...generics];

  return PHASE_ORDER.flatMap(phase => all.filter(t => t.phase === phase));
}

export interface SuggestedPlanRow {
  id: string;
  title: string;
  dates: string[];
}

/**
 * Bygger ett komplett upplägg: förstå tidigt, träna i mitten, repetera nära deadline.
 * Träningsmomenten får en extra dag längre fram när det finns utrymme (spridd repetition).
 */
export function buildSuggestedPlan(
  days: Date[],
  suggestions: StudyTechnique[]
): SuggestedPlanRow[] {
  const picked: StudyTechnique[] = [];
  const takeFrom = (phase: StudyPhase, count: number) => {
    suggestions
      .filter(t => t.phase === phase)
      .slice(0, count)
      .forEach(t => picked.push(t));
  };
  takeFrom('understand', 1);
  takeFrom('practice', 2);
  takeFrom('review', 1);

  const fallback = picked.length > 0 ? picked : suggestions.slice(0, 3);
  const dates = days.map(day => format(day, 'yyyy-MM-dd'));

  return fallback.map((technique, index) => {
    const row: SuggestedPlanRow = {
      id: crypto.randomUUID(),
      title: technique.label,
      dates: [],
    };
    if (dates.length === 0) return row;

    const last = dates.length - 1;
    const position =
      fallback.length === 1 ? 0 : Math.round((index * last) / (fallback.length - 1));
    const chosen = new Set<string>([dates[position]]);

    // Spridd repetition: träningsmoment får en extra dag med minst en dags lucka.
    if (technique.phase === 'practice' && dates.length >= 4) {
      const spaced = Math.min(position + 2, last);
      if (spaced !== position) chosen.add(dates[spaced]);
    }

    row.dates = [...chosen].sort();
    return row;
  });
}
