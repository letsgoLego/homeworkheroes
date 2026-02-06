export type Subject = 
  | 'math' 
  | 'science' 
  | 'language' 
  | 'history' 
  | 'art' 
  | 'music' 
  | 'english' 
  | 'other';

export type HomeworkType = 'inlamning' | 'forhor';

export interface StudyTask {
  id: string;
  homeworkId: string;
  title: string;
  date: string; // ISO date string
  completed: boolean;
  completedAt?: string;
  snoozedUntil?: string; // ISO date string - task is snoozed until this date
}

export interface Homework {
  id: string;
  title: string;
  subject: Subject;
  description?: string;
  dueDate: string; // ISO date string
  createdAt: string;
  childId: string;
  bringToSchool?: string[]; // Items to bring
  tasks: StudyTask[];
  completed: boolean;
  completedAt?: string;
  needsMorePractice?: boolean;
  homeworkType?: HomeworkType; // inlamning or forhor
}

export interface Child {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  familyId: string;
}

export interface RecurringPackItem {
  id: string;
  childId: string;
  itemName: string;
  weekdays: number[]; // 0 = Sunday, 1 = Monday, etc.
  createdAt: string;
}

export interface AdhocTask {
  id: string;
  childId: string;
  title: string;
  taskDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  isParent: boolean;
  familyId: string;
  childId?: string; // If this member is linked to a child profile
}

export interface Family {
  id: string;
  name: string;
  createdAt: string;
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: 'Matte',
  science: 'NO',
  language: 'Svenska',
  history: 'SO',
  art: 'Bild',
  music: 'Musik',
  english: 'Engelska',
  other: 'Övrigt',
};

export const SUBJECT_ICONS: Record<Subject, string> = {
  math: '🔢',
  science: '🔬',
  language: '📚',
  history: '🏛️',
  art: '🎨',
  music: '🎵',
  english: '🇬🇧',
  other: '📝',
};

export const HOMEWORK_TYPE_LABELS: Record<HomeworkType, string> = {
  inlamning: 'Inlämning',
  forhor: 'Förhör',
};

export const HOMEWORK_TYPE_ICONS: Record<HomeworkType, string> = {
  inlamning: '📄',
  forhor: '✍️',
};
