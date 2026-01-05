import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Homework } from '@/types/homework';
import { Trophy, Calendar, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { useHomeworkStore } from '@/stores/homeworkStore';
import { addDays, format } from 'date-fns';

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  homework: Homework | null;
}

export function CompletionModal({ open, onClose, homework }: CompletionModalProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const { scheduleMorePractice } = useHomeworkStore();
  
  if (!homework) return null;
  
  const handleKnowItAll = () => {
    onClose();
    setShowScheduler(false);
  };
  
  const handleNeedPractice = () => {
    setShowScheduler(true);
  };
  
  const handleSchedulePractice = (days: number[]) => {
    const today = new Date();
    const dates = days.map(d => format(addDays(today, d), 'yyyy-MM-dd'));
    scheduleMorePractice(homework.id, dates);
    onClose();
    setShowScheduler(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-elevated">
        <AnimatePresence mode="wait">
          {!showScheduler ? (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center py-6"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1.1, 1.1, 1],
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-celebration/20 flex items-center justify-center shadow-glow-celebration">
                  <Trophy className="w-12 h-12 text-celebration" />
                </div>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                Amazing Job! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground mb-6"
              >
                You completed <span className="font-semibold text-foreground">{homework.title}</span>!
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg font-medium mb-6"
              >
                Do you know it all, or should we practice more?
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 w-full"
              >
                <Button
                  onClick={handleKnowItAll}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground shadow-glow-primary"
                  size="lg"
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  I Know It All!
                </Button>
                <Button
                  onClick={handleNeedPractice}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Practice More
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="scheduler"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-6"
            >
              <h2 className="text-xl font-bold mb-4 text-center">
                Schedule Practice Sessions
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                When would you like to practice again?
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handleSchedulePractice([1])}
                  variant="outline"
                  className="justify-start h-14 text-left"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Tomorrow</div>
                    <div className="text-xs text-muted-foreground">Quick review</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleSchedulePractice([2, 5])}
                  variant="outline"
                  className="justify-start h-14 text-left"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">In 2 and 5 days</div>
                    <div className="text-xs text-muted-foreground">Spaced repetition</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleSchedulePractice([1, 3, 7])}
                  variant="outline"
                  className="justify-start h-14 text-left"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">1, 3, and 7 days</div>
                    <div className="text-xs text-muted-foreground">Best for memorization</div>
                  </div>
                </Button>
              </div>
              
              <Button
                onClick={() => setShowScheduler(false)}
                variant="ghost"
                className="w-full mt-4"
              >
                Go Back
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
