import type { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn('min-h-screen bg-background pb-24 md:pb-0 md:pl-24', className)}>
      <div className="mx-auto min-h-screen w-full max-w-7xl">{children}</div>
      <Navigation />
    </div>
  );
}