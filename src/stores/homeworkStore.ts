import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Homework, StudyTask, Child, Subject } from '@/types/homework';
import { addDays, format, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';

interface HomeworkStore {
  homework: Homework[];
  children: Child[];
  activeChildId: string | null;
  
  // Child actions
  setActiveChild: (childId: string) => void;
  addChild: (child: Omit<Child, 'id' | 'familyId'>) => Child;
  
  // Homework actions
  addHomework: (homework: Omit<Homework, 'id' | 'createdAt' | 'tasks' | 'completed'>) => Homework;
  updateHomework: (id: string, updates: Partial<Homework>) => void;
  deleteHomework: (id: string) => void;
  
  // Task actions
  addTask: (homeworkId: string, task: Omit<StudyTask, 'id' | 'homeworkId' | 'completed'>) => void;
  toggleTask: (taskId: string) => { allCompleted: boolean; homework: Homework | null };
  deleteTask: (taskId: string) => void;
  
  // Queries
  getHomeworkForChild: (childId: string) => Homework[];
  getTasksForDate: (childId: string, date: Date) => StudyTask[];
  getItemsToBringForDate: (childId: string, date: Date) => { homework: Homework; items: string[] }[];
  getUpcomingDueDates: (childId: string) => Homework[];
  
  // Schedule more practice
  scheduleMorePractice: (homeworkId: string, dates: string[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Demo data
const createDemoData = (): { homework: Homework[]; children: Child[] } => {
  const childId = 'demo-child-1';
  const today = new Date();
  
  const children: Child[] = [
    { id: childId, name: 'Emma', color: '#2eb8a6', familyId: 'demo-family' },
  ];
  
  const homework: Homework[] = [
    {
      id: 'hw-1',
      title: 'Math Chapter 5',
      subject: 'math',
      description: 'Complete exercises 1-20',
      dueDate: format(addDays(today, 3), 'yyyy-MM-dd'),
      createdAt: format(today, 'yyyy-MM-dd'),
      childId,
      bringToSchool: ['Math workbook', 'Calculator'],
      tasks: [
        { id: 't-1', homeworkId: 'hw-1', title: 'Exercises 1-10', date: format(today, 'yyyy-MM-dd'), completed: false },
        { id: 't-2', homeworkId: 'hw-1', title: 'Exercises 11-20', date: format(addDays(today, 1), 'yyyy-MM-dd'), completed: false },
      ],
      completed: false,
    },
    {
      id: 'hw-2',
      title: 'Science Project',
      subject: 'science',
      description: 'Build a volcano model',
      dueDate: format(addDays(today, 5), 'yyyy-MM-dd'),
      createdAt: format(today, 'yyyy-MM-dd'),
      childId,
      bringToSchool: ['Volcano model', 'Presentation notes'],
      tasks: [
        { id: 't-3', homeworkId: 'hw-2', title: 'Research volcanoes', date: format(today, 'yyyy-MM-dd'), completed: true, completedAt: format(today, 'yyyy-MM-dd') },
        { id: 't-4', homeworkId: 'hw-2', title: 'Build base structure', date: format(addDays(today, 1), 'yyyy-MM-dd'), completed: false },
        { id: 't-5', homeworkId: 'hw-2', title: 'Paint and decorate', date: format(addDays(today, 2), 'yyyy-MM-dd'), completed: false },
      ],
      completed: false,
    },
  ];
  
  return { homework, children };
};

const demoData = createDemoData();

export const useHomeworkStore = create<HomeworkStore>()(
  persist(
    (set, get) => ({
      homework: demoData.homework,
      children: demoData.children,
      activeChildId: demoData.children[0]?.id || null,
      
      setActiveChild: (childId) => set({ activeChildId: childId }),
      
      addChild: (childData) => {
        const newChild: Child = {
          ...childData,
          id: generateId(),
          familyId: 'demo-family',
        };
        set((state) => ({
          children: [...state.children, newChild],
          activeChildId: state.activeChildId || newChild.id,
        }));
        return newChild;
      },
      
      addHomework: (homeworkData) => {
        const newHomework: Homework = {
          ...homeworkData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          tasks: [],
          completed: false,
        };
        set((state) => ({
          homework: [...state.homework, newHomework],
        }));
        return newHomework;
      },
      
      updateHomework: (id, updates) => {
        set((state) => ({
          homework: state.homework.map((hw) =>
            hw.id === id ? { ...hw, ...updates } : hw
          ),
        }));
      },
      
      deleteHomework: (id) => {
        set((state) => ({
          homework: state.homework.filter((hw) => hw.id !== id),
        }));
      },
      
      addTask: (homeworkId, taskData) => {
        const newTask: StudyTask = {
          ...taskData,
          id: generateId(),
          homeworkId,
          completed: false,
        };
        set((state) => ({
          homework: state.homework.map((hw) =>
            hw.id === homeworkId
              ? { ...hw, tasks: [...hw.tasks, newTask] }
              : hw
          ),
        }));
      },
      
      toggleTask: (taskId) => {
        let allCompleted = false;
        let foundHomework: Homework | null = null;
        
        set((state) => {
          const newHomework = state.homework.map((hw) => {
            const taskIndex = hw.tasks.findIndex((t) => t.id === taskId);
            if (taskIndex === -1) return hw;
            
            const newTasks = hw.tasks.map((t) =>
              t.id === taskId
                ? { 
                    ...t, 
                    completed: !t.completed,
                    completedAt: !t.completed ? new Date().toISOString() : undefined,
                  }
                : t
            );
            
            allCompleted = newTasks.every((t) => t.completed);
            foundHomework = {
              ...hw,
              tasks: newTasks,
              completed: allCompleted,
              completedAt: allCompleted ? new Date().toISOString() : undefined,
            };
            
            return foundHomework;
          });
          
          return { homework: newHomework };
        });
        
        return { allCompleted, homework: foundHomework };
      },
      
      deleteTask: (taskId) => {
        set((state) => ({
          homework: state.homework.map((hw) => ({
            ...hw,
            tasks: hw.tasks.filter((t) => t.id !== taskId),
          })),
        }));
      },
      
      getHomeworkForChild: (childId) => {
        return get().homework.filter((hw) => hw.childId === childId);
      },
      
      getTasksForDate: (childId, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return get()
          .homework.filter((hw) => hw.childId === childId)
          .flatMap((hw) => hw.tasks.filter((t) => t.date === dateStr));
      },
      
      getItemsToBringForDate: (childId, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return get()
          .homework.filter(
            (hw) =>
              hw.childId === childId &&
              hw.dueDate === dateStr &&
              hw.bringToSchool &&
              hw.bringToSchool.length > 0
          )
          .map((hw) => ({ homework: hw, items: hw.bringToSchool || [] }));
      },
      
      getUpcomingDueDates: (childId) => {
        const today = new Date();
        return get()
          .homework.filter(
            (hw) =>
              hw.childId === childId &&
              !hw.completed &&
              (isSameDay(parseISO(hw.dueDate), today) ||
                isAfter(parseISO(hw.dueDate), today))
          )
          .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
      },
      
      scheduleMorePractice: (homeworkId, dates) => {
        const homework = get().homework.find((hw) => hw.id === homeworkId);
        if (!homework) return;
        
        set((state) => ({
          homework: state.homework.map((hw) => {
            if (hw.id !== homeworkId) return hw;
            
            const newTasks: StudyTask[] = dates.map((date, index) => ({
              id: generateId(),
              homeworkId,
              title: `Practice session ${index + 1}`,
              date,
              completed: false,
            }));
            
            return {
              ...hw,
              needsMorePractice: true,
              completed: false,
              completedAt: undefined,
              tasks: [...hw.tasks, ...newTasks],
            };
          }),
        }));
      },
    }),
    {
      name: 'homework-hero-storage',
    }
  )
);
