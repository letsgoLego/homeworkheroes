import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionState {
  subscribed: boolean;
  status: 'free' | 'active' | 'canceled' | 'gifted';
  subscriptionEnd: string | null;
  interval: string | null;
  loading: boolean;
}

const MONTHLY_PRICE_ID = 'price_1TEtfJ12mugrDSilvyDPiuYu';
const YEARLY_PRICE_ID = 'price_1TEtfk12mugrDSilFIUUA2HJ';

export const STRIPE_PRICES = {
  monthly: { priceId: MONTHLY_PRICE_ID, amount: 49, label: '49 kr/mån' },
  yearly: { priceId: YEARLY_PRICE_ID, amount: 490, label: '490 kr/år' },
} as const;

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    status: 'free',
    subscriptionEnd: null,
    interval: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // First check if the family has a gifted override
      const { data: roles } = await supabase
        .from('user_roles')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1);

      if (roles && roles.length > 0 && roles[0].family_id) {
        const { data: familyData } = await supabase
          .from('families')
          .select('subscription_override')
          .eq('id', roles[0].family_id)
          .maybeSingle();

        if (familyData?.subscription_override === 'gifted') {
          setState({
            subscribed: true,
            status: 'gifted',
            subscriptionEnd: null,
            interval: null,
            loading: false,
          });
          return;
        }
      }

      // Otherwise check Stripe
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      setState({
        subscribed: data.subscribed ?? false,
        status: data.status ?? 'free',
        subscriptionEnd: data.subscription_end ?? null,
        interval: data.interval ?? null,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();

    // Refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = useCallback(async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      throw err;
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      throw err;
    }
  }, []);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
