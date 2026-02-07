
# Fix Snooze Feature - Tasks Should Appear the Next Day

## Problem
Currently when you snooze a task:
1. ✅ It's shown as snoozed with a 💤 symbol on the original day
2. ❌ The next day, the snoozed task does NOT appear as an active task
3. ❌ No restriction prevents snoozing past the homework's due date

## Root Cause
The `getTasksForDate` function only filters tasks by their original `task_date`. It doesn't include tasks that have been snoozed TO that date.

```text
Current logic:
┌─────────────────────────────────────────────────────┐
│  getTasksForDate(date)                              │
│  └─ Filter: task.task_date === date                 │
│     (Snoozed tasks never appear on snooze date!)    │
└─────────────────────────────────────────────────────┘

Fixed logic:
┌─────────────────────────────────────────────────────┐
│  getTasksForDate(date)                              │
│  ├─ Original tasks: task.task_date === date         │
│  │   AND snoozed_until is null/past                 │
│  └─ Snoozed tasks: task.snoozed_until === date      │
│     (These appear as active, can snooze again)      │
└─────────────────────────────────────────────────────┘
```

## Solution

### 1. Update `getTasksForDate` in `useFamily.ts`
Modify the function to include tasks that were snoozed until the current date:

- **Original tasks for today**: `task_date === today AND (snoozed_until IS NULL OR snoozed_until < today)`
- **Snoozed tasks for today**: `snoozed_until === today` (regardless of original `task_date`)

### 2. Update `snoozeTask` in `useFamily.ts`
Add validation to prevent snoozing past the homework's due date:
- Find the task and its parent homework
- Compare tomorrow's date with the homework's `due_date`
- If tomorrow is after the due date, show an error toast and return false

### 3. Update `TodayPage.tsx` Task Filtering
Adjust the filtering logic to:
- Show snoozed tasks that have "woken up" today as **active tasks** (in the incomplete section)
- Mark these tasks visually as "previously snoozed" so users know they were snoozed
- Allow them to be completed OR snoozed again (if not past due date)

### 4. Update `TaskCard.tsx`
- Add new prop `wasSnoozed` to indicate a task that was snoozed and is now appearing
- Show a small indicator (e.g., 🔔 or similar) for tasks that were snoozed and are now active
- Pass the homework due date to enable/disable the snooze button based on whether tomorrow is past the due date

---

## Technical Details

### File Changes

**`src/hooks/useFamily.ts`**
- Modify `getTasksForDate`:
```typescript
const getTasksForDate = (childId: string, date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return homework
    .filter(hw => hw.child_id === childId)
    .flatMap(hw => 
      hw.tasks
        .filter(t => {
          // Include if: task is scheduled for this date AND not snoozed to future
          const isScheduledToday = t.task_date === dateStr && 
            (!t.snoozed_until || t.snoozed_until <= dateStr);
          
          // OR: task was snoozed UNTIL this date
          const isSnoozedToday = t.snoozed_until === dateStr;
          
          return isScheduledToday || isSnoozedToday;
        })
        .map(task => ({ 
          task, 
          homework: hw,
          wasSnoozed: task.snoozed_until === dateStr // Flag for UI
        }))
    );
};
```

- Modify `snoozeTask`:
```typescript
const snoozeTask = async (taskId: string, homeworkDueDate: string) => {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  
  // Prevent snoozing past due date
  if (tomorrow > homeworkDueDate) {
    toast.error('Kan inte snooza förbi deadline');
    return false;
  }
  
  // existing update logic...
};
```

**`src/pages/TodayPage.tsx`**
- Update task filtering to properly categorize snoozed-and-returned tasks as incomplete (active)
- Pass due date to snooze function

**`src/components/TaskCard.tsx`**
- Add `wasSnoozed` prop to show visual indicator
- Add `canSnooze` prop based on due date validation
- Disable snooze button when can't snooze past due date

---

## Expected Behavior After Fix

| Day | Original Task Date | Snooze Action | Result |
|-----|-------------------|---------------|--------|
| Monday | Monday | Snooze | Shown as snoozed on Monday, appears as active on Tuesday |
| Tuesday | Monday (snoozed) | Complete | Task completed, clears snooze |
| Tuesday | Monday (snoozed) | Snooze again | Appears as active on Wednesday (if before due date) |
| Tuesday | Monday (snoozed, due Wed) | Snooze again | Works (Wed is not past due) |
| Wednesday | Monday (snoozed, due Wed) | Try to snooze | Blocked with error message |

