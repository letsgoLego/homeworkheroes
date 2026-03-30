import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';

const TOUR_KEY = 'laxhjalpen_intro_tour_done';

interface TourStep {
  title: string;
  description: string;
  emoji: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Dagens uppgifter',
    description: 'Här ser du alla uppgifter som ska göras idag. Bocka av dem efterhand!',
    emoji: '📝',
  },
  {
    title: 'Byt barn',
    description: 'Använd flikarna högst upp för att växla mellan dina barns uppgifter.',
    emoji: '👦',
  },
  {
    title: 'Lägg till läxor',
    description: 'Tryck på + i menyn längst ner för att lägga till en ny läxa.',
    emoji: '➕',
  },
  {
    title: 'Veckoöversikt',
    description: 'Se alla kommande inlämningar och prov i veckovyn.',
    emoji: '📅',
  },
];

export function IntroTour() {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Small delay so page renders first
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(TOUR_KEY, 'true');
  };

  const next = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismiss();
    }
  };

  if (!show) return null;

  const step = tourSteps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
        onClick={dismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground font-medium">
              {currentStep + 1} / {tourSteps.length}
            </span>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center mb-6">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl mb-3"
            >
              {step.emoji}
            </motion.div>
            <h3 className="text-lg font-bold mb-1">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={dismiss} className="flex-1">
              Hoppa över
            </Button>
            <Button onClick={next} className="flex-1">
              {currentStep < tourSteps.length - 1 ? (
                <>Nästa <ArrowRight className="w-4 h-4 ml-1" /></>
              ) : (
                'Klar!'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
