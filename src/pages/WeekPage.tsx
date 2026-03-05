import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addWeeks, subWeeks } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekView } from '@/components/WeekView';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useFamily } from '@/hooks/useFamily';

export default function WeekPage() {
  const [showAddChild, setShowAddChild] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { children, activeChildId, setActiveChildId, homework, loading } = useFamily();
  
  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };
  
  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };
  
  const handleToday = () => {
    setSelectedDate(new Date());
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Veckoöversikt 📅</h1>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Idag
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium">
              {format(selectedDate, 'MMMM yyyy', { locale: sv })}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Child switcher - only for parents */}
        {!loading && children.length > 0 && (
          <div className="px-4 pb-3">
            <ChildSwitcher 
              children={children}
              activeChildId={activeChildId}
              onSelectChild={setActiveChildId}
              onAddChild={() => setShowAddChild(true)} 
            />
          </div>
        )}
      </header>
      
      <main className="px-4 py-4">
        <WeekView 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate}
          homework={homework}
          activeChildId={activeChildId}
        />
      </main>
      
      <Navigation />
      <AddChild open={showAddChild} onClose={() => setShowAddChild(false)} />
    </div>
  );
}
