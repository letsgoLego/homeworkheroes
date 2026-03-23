

## Plan: Reduce Backend Consumption

### Problem Summary
Each user interaction triggers 6+ DB queries via `fetchFamilyData()`, often doubled by realtime echo. A single task completion = ~12 queries. Multiply by family members and daily usage.

### Optimizations (ordered by impact)

**1. Debounce realtime refetches**
- Add a 1-second debounce to the realtime handler so rapid changes (e.g. checking off multiple tasks) batch into one refetch instead of one per change.
- Prevents the "mutation + realtime echo" double-fetch problem.

**2. Optimistic local state updates instead of full refetch**
- For `toggleTask`, `deleteTask`, `snoozeTask`, `toggleAdhocTask`, `deleteAdhocTask`: update the local state arrays directly after a successful mutation.
- Remove the `await fetchFamilyData()` calls from these mutation functions.
- Realtime subscription remains as a safety net but with debounce from step 1.
- This eliminates ~6 queries per user action.

**3. Filter homework by date range**
- Add `.gte('due_date', thirtyDaysAgo)` to the homework query so you don't fetch ancient completed homework.
- Reduces payload size and query cost as data grows.

**4. Combine queries where possible**
- Fetch homework with tasks in a single query using Supabase's relation syntax: `.select('*, study_tasks(*)')` instead of two separate queries.
- Reduces 2 queries to 1 per refetch.

**5. Remove redundant realtime tables**
- The `children` table rarely changes. Remove it from the realtime subscription. Child additions/deletions can trigger a manual refetch.
- Saves 1 realtime channel subscription.

### Files to Change
- `src/hooks/useFamily.ts` — All 5 optimizations live here

### Expected Impact
- ~70-80% reduction in database queries during normal usage
- Each task toggle: from ~12 queries down to ~1 (the mutation itself)
- Background realtime: batched to max 1 refetch per second instead of per-event

### No User-Facing Changes
Everything works identically from the user's perspective. The UI updates faster (optimistic) and the backend does less work.

