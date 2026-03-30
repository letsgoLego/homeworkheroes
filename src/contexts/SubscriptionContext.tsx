import { createContext, useContext, ReactNode } from 'react';
import { useSubscription, STRIPE_PRICES } from '@/hooks/useSubscription';

type SubscriptionContextType = ReturnType<typeof useSubscription>;

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscription = useSubscription();
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext(): SubscriptionContextType {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return ctx;
}

export { STRIPE_PRICES };
