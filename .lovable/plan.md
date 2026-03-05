

## Plan: Role-Based Views (Parent vs Child)

### Current State
- `useFamily` already tracks `userRole` ('parent' | 'child') and `child_id` from `user_roles`
- For child users, it already auto-sets `activeChildId` to their linked child
- But the UI shows everything: child switcher, add child, family settings, all children's data
- Children can currently navigate to all pages including Family settings, Add homework, etc.

### What Needs to Change

**1. Filter data for child users in `useFamily.ts`**
- When `userRole === 'child'`, only fetch data for that specific child (not all family children)
- Lock `activeChildId` to the child's own ID — prevent switching
- Only return the single child in the `children` array

**2. Conditional UI in `TodayPage.tsx`**
- Hide `ChildSwitcher` for child users (they only see their own data)
- Hide "Add child" functionality
- Simplify the header greeting (no switcher needed)

**3. Conditional navigation in `Navigation.tsx`**
- For children: hide "Familj" tab and "Lägg till" (add homework) button
- Show only "Idag", "Vecka" tabs (children consume, parents manage)

**4. Simplified child profile page (optional replacement for Family page)**
- Children see: their own stats, logout button, account info
- No invite codes, no manage children, no install prompts

**5. Protect routes in `App.tsx`**
- `/add` and `/family` routes: redirect child users to `/`
- `/onboarding` is parent-only

**6. Auth page updates**
- `AuthPage` (email login) and `ChildLoginPage` (username login) already exist and work
- No changes needed for login flow itself

### Technical Approach

**`useFamily.ts` changes:**
- After determining `userRole === 'child'` and getting `child_id`, filter `children` array to only that child
- Lock `setActiveChildId` to be a no-op for children
- Data already filtered by `child_id` via existing code since `childIds` comes from `children` array

**`Navigation.tsx` changes:**
- Accept `userRole` prop or use a new `useUserRole()` hook
- Conditionally render nav items based on role

**`TodayPage.tsx` changes:**
- Conditionally hide `ChildSwitcher` when `userRole === 'child'`

**`App.tsx` changes:**
- Create `ParentRoute` wrapper that redirects children to `/`

**`WeekPage.tsx` changes:**
- Same child switcher hiding as TodayPage

**`AddPage.tsx` changes:**
- Restrict to parents only (via route protection)

**`FamilyPage.tsx` changes:**
- For children: show minimal profile view (name, logout)
- Or simply block access via route

### Implementation Steps

1. Update `useFamily.ts` to filter children array for child users
2. Update `Navigation.tsx` to show role-appropriate tabs
3. Update `TodayPage.tsx` and `WeekPage.tsx` to hide child switcher for children
4. Add `ParentRoute` in `App.tsx` to protect `/add` and `/family`
5. Create a simple child profile/settings page as an alternative to FamilyPage

