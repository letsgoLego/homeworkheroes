import type { HomeworkType, Subject } from '@/types/homework';

export interface StudyTechnique {
  id: string;
  label: string;
  description: string;
  icon?: string;
  subjects?: Subject[];
}

export const GENERAL_TECHNIQUES: StudyTechnique[] = [
  {
    id: 'read-through',
    label: 'Läsa igenom',
    description: 'Börja med att läsa igenom materialet och markera nyckelord.',
    icon: '👁️',
  },
  {
    id: 'summarise',
    label: 'Sammanfatta',
    description: 'Skriv korta egna sammanfattningar – det stärker minnet.',
    icon: '✍️',
  },
  {
    id: 'mini-test',
    label: 'Gör delförhör',
    description: 'Testa dig själv på ett litet område i taget.',
    icon: '🧠',
  },
  {
    id: 'fill-in-blanks',
    label: 'Lucktext',
    description: 'Täck över delar av texten och försök fylla i orden.',
    icon: '🔲',
  },
  {
    id: 'explain-to-someone',
    label: 'Förklara för någon',
    description: 'Förklara högt för en förälder eller kompis.',
    icon: '🗣️',
  },
  {
    id: 'mind-map',
    label: 'Tankekarta',
    description: 'Rita upp samband mellan begrepp för att se helheten.',
    icon: '🕸️',
  },
  {
    id: 'mnemonics',
    label: 'Minnesregel',
    description: 'Skapa en ramsa, bild eller association som hjälper dig minnas.',
    icon: '🎭',
  },
];

export const SUBJECT_TECHNIQUES: StudyTechnique[] = [
  {
    id: 'math-old-problems',
    label: 'Räkna gamla uppgifter',
    description: 'Repetera genom att räkna liknande uppgifter igen.',
    icon: '📐',
    subjects: ['math'],
  },
  {
    id: 'math-formulas',
    label: 'Skriv formler för hand',
    description: 'Att skriva formler för hand hjälper minnet bättre än att läsa dem.',
    icon: '📝',
    subjects: ['math'],
  },
  {
    id: 'math-practice',
    label: 'Gör övningsuppgifter',
    description: 'Öva på varierade uppgifter för att bli säker.',
    icon: '🧮',
    subjects: ['math'],
  },
  {
    id: 'language-vocab',
    label: 'Repetera glosor',
    description: 'Gå igenom glosor flera gånger under veckan.',
    icon: '🔤',
    subjects: ['english'],
  },
  {
    id: 'language-vocab-test',
    label: 'Gör glosförhör',
    description: 'Låt någon testa dig på glosorna.',
    icon: '🎤',
    subjects: ['english'],
  },
  {
    id: 'language-read-aloud',
    label: 'Läs högt',
    description: 'Att läsa högt tränar uttal och förståelse.',
    icon: '📢',
    subjects: ['english', 'language'],
  },
  {
    id: 'language-writing',
    label: 'Skriv stilövning',
    description: 'Öva på att formulera dig skriftligt i ämnet.',
    icon: '📜',
    subjects: ['language'],
  },
  {
    id: 'language-grammar',
    label: 'Repetera grammatik',
    description: 'Gå igenom regler för ordklasser och satsdelar.',
    icon: '🏗️',
    subjects: ['language'],
  },
  {
    id: 'science-facts',
    label: 'Sammanfatta fakta',
    description: 'Samla viktiga fakta i en egen faktabank.',
    icon: '📋',
    subjects: ['science', 'history'],
  },
  {
    id: 'science-concept-map',
    label: 'Gör tankekarta',
    description: 'Visa hur begrepp hänger ihop i ett diagram.',
    icon: '🕸️',
    subjects: ['science', 'history'],
  },
];

export function getStudyTechniqueSuggestions(
  subject: Subject,
  homeworkType: HomeworkType
): StudyTechnique[] {
  if (homeworkType !== 'forhor') return [];

  const subjectSpecific = SUBJECT_TECHNIQUES.filter(
    (t) => !t.subjects || t.subjects.includes(subject)
  );

  const existingIds = new Set(subjectSpecific.map((t) => t.id));
  const generics = GENERAL_TECHNIQUES.filter((t) => !existingIds.has(t.id));

  return [...subjectSpecific, ...generics];
}
