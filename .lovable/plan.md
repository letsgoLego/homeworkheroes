

## Plan: Optimize Cloud Costs

### Problem
The `check-subscription` Edge Function runs every 60 seconds per user, each time making 2-3 Stripe API calls. This is the dominant cost driver. Additionally, multiple components independently call `useSubscription`, potentially multiplying the polling.

### Changes

#### 1. Cache subscription status in the database
Instead of polling Stripe every 60 seconds, store subscription status on the `families` table (fields already partially exist with `subscription_override`). Add columns: `subscription_status`, `subscription_end`, `subscription_interval`, `subscription_checked_at`.

The Edge Function only queries Stripe if the cached data is older than 1 hour (or on explicit refresh). This reduces Stripe API calls from ~1440/user/day to ~24/user/day.

#### 2. Increase polling interval to 5 minutes + use cached DB data
Change the `setInterval` in `useSubscription` from 60s to 300s. On each check, first read the cached status from the `families` table. Only invoke the Edge Function if the cache is stale (>1 hour old).

#### 3. Deduplicate useSubscription with React Context
Wrap subscription state in a `SubscriptionProvider` context so that all 4 components share a single polling instance instead of potentially running separate ones.

#### 4. Skip Stripe check for gifted families early
Already partially done — but currently it still makes 2 DB queries before short-circuiting. Move the gifted check into the initial `fetchFamilyData` flow so no extra queries are needed.

### Files to modify
- `supabase/migrations/` — add caching columns to `families`
- `supabase/functions/check-subscription/index.ts` — add cache read/write logic
- `src/hooks/useSubscription.ts` — increase interval, read from DB cache, skip Edge Function when fresh
- `src/contexts/SubscriptionContext.tsx` — new context provider
- `src/App.tsx` — add SubscriptionProvider
- Components using `useSubscription` — switch to context

### Expected impact
- Edge Function invocations reduced by ~90-95%
- Stripe API calls reduced by ~95%
- Realtime and DB query costs stay the same (already optimized)

