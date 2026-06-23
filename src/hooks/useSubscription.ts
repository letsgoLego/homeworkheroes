import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';

interface SubscriptionState {
  subscribed: boolean;
  status: 'free' | 'active' | 'canceled' | 'gifted';
  subscriptionEnd: string | null;
  interval: string | null;
  loading: boolean;
}

const MONTHLY_PRICE_ID = 'price_1TGDHt12mugrDSilX1WEgjZZ';
const YEARLY_PRICE_ID = 'price_1TGDIA12mugrDSilbUrBpQPE';

export const STRIPE_PRICES = {
  monthly: { priceId: MONTHLY_PRICE_ID, amount: 39, label: '39 kr/mån' },
  yearly: { priceId: YEARLY_PRICE_ID, amount: 399, label: '399 kr/år' },
} as const;

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
      // First read cached data from the families table
      const { data: roles } = await supabase
        .from('user_roles')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1);

      if (roles && roles.length > 0 && roles[0].family_id) {
        const familyId = roles[0].family_id;
        const { data: familyData } = await supabase
          .from('families')
          .select('subscription_override, subscription_status, subscription_end, subscription_interval, subscription_checked_at')
          .eq('id', familyId)
          .maybeSingle();

        // Gifted → done
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

        // If cache is fresh, use it without calling the Edge Function
        if (familyData?.subscription_checked_at) {
          const age = Date.now() - new Date(familyData.subscription_checked_at).getTime();
          if (age < CACHE_MAX_AGE_MS) {
            const cachedStatus = (familyData.subscription_status || 'free') as SubscriptionState['status'];
            const cachedEnd = familyData.subscription_end;
            const isSubscribed = cachedStatus === 'active' ||
              (cachedStatus === 'canceled' && !!cachedEnd && new Date(cachedEnd) > new Date());
            setState({
              subscribed: isSubscribed,
              status: cachedStatus,
              subscriptionEnd: cachedEnd,
              interval: familyData.subscription_interval,
              loading: false,
            });
            return;
          }
        }
      }

      // Cache is stale or missing — invoke Edge Function (which will also update cache)
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

    const interval = setInterval(checkSubscription, POLL_INTERVAL);
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
