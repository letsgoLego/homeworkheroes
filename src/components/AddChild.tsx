import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFamily } from '@/hooks/useFamily';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddChildProps {
  open: boolean;
  onClose: () => void;
}

const colors = [
  '#2eb8a6', // teal
  '#f97853', // coral
  '#9b59b6', // purple
  '#3498db', // blue
  '#e6c229', // yellow
  '#27ae60', // green
  '#e74c3c', // red
  '#f39c12', // orange
];

export function AddChild({ open, onClose }: AddChildProps) {
  const { addChild } = useFamily();
  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    
    setLoading(true);
    const result = await addChild(name.trim(), color);
    setLoading(false);
    
    if (result) {
      setName('');
      setColor(colors[0]);
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm border-0 shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add a Child</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="childName" className="text-sm font-medium">
              What's their name?
            </Label>
            <Input
              id="childName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emma"
              className="mt-1.5"
              autoFocus
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium">Pick a color</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-10 h-10 rounded-full transition-all',
                    color === c && 'ring-2 ring-offset-2 ring-foreground scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Adding...' : 'Add Child'}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
