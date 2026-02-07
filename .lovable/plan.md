# ✅ Fix Snooze Feature - COMPLETED

## Summary
Fixed the snooze feature so that:
1. ✅ Snoozed tasks appear as active tasks the next day (with "🔔 Från igår" indicator)
2. ✅ Users can complete or snooze the task again
3. ✅ Cannot snooze past the homework's due date (disabled button + error toast)

## Changes Made

### `src/hooks/useFamily.ts`
- Updated `getTasksForDate` to include tasks where `snoozed_until === dateStr` (tasks that "wake up" today)
- Added `wasSnoozed` flag to identify tasks that came from a snooze
- Updated `snoozeTask` to accept optional `homeworkDueDate` and validate before snoozing

### `src/pages/TodayPage.tsx`
- Updated filtering logic: snoozed tasks that "woke up" today are now in `incompleteTasks` (active section)
- Added `canSnoozeTask` helper to check if snoozing is allowed based on due date
- Pass `wasSnoozed` and `canSnooze` props to TaskCard

### `src/components/TaskCard.tsx`
- Added `wasSnoozed` prop to show "🔔 Från igår" indicator
- Added `canSnooze` prop to disable snooze button when tomorrow > due date
- Updated snooze handler to pass homework due date for validation
