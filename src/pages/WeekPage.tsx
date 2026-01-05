import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekView } from '@/components/WeekView';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';

export default function WeekPage() {
  const [showAddChild, setShowAddChild] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };
  
  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };
  
  const handleToday = () => {
    setSelectedDate(new Date());
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Week View 📅</h1>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
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
              {format(selectedDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Child switcher */}
        <div className="px-4 pb-3">
          <ChildSwitcher onAddChild={() => setShowAddChild(true)} />
        </div>
      </header>
      
      <main className="px-4 py-4">
        <WeekView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </main>
      
      <Navigation />
      <AddChild open={showAddChild} onClose={() => setShowAddChild(false)} />
    </div>
  );
}
