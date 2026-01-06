import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { Home, Calendar, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Idag' },
  { path: '/week', icon: Calendar, label: 'Vecka' },
  { path: '/add', icon: Plus, label: 'Lägg till', isAction: true },
  { path: '/family', icon: Users, label: 'Familj' },
];

export function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom z-50">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          if (item.isAction) {
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative -mt-6"
                >
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-glow-primary">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </motion.div>
              </Link>
            );
          }
          
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
