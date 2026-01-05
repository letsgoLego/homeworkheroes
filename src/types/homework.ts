export type Subject = 
  | 'math' 
  | 'science' 
  | 'language' 
  | 'history' 
  | 'art' 
  | 'music' 
  | 'sports' 
  | 'other';

export interface StudyTask {
  id: string;
  homeworkId: string;
  title: string;
  date: string; // ISO date string
  completed: boolean;
  completedAt?: string;
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
}

export interface Child {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  familyId: string;
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
  math: 'Math',
  science: 'Science',
  language: 'Language',
  history: 'History',
  art: 'Art',
  music: 'Music',
  sports: 'Sports',
  other: 'Other',
};

export const SUBJECT_ICONS: Record<Subject, string> = {
  math: '🔢',
  science: '🔬',
  language: '📚',
  history: '🏛️',
  art: '🎨',
  music: '🎵',
  sports: '⚽',
  other: '📝',
};
