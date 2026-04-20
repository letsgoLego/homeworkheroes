import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;
type Family = Tables<'families'>;

interface FamilyDataResult {
  role: 'parent' | 'child' | null;
  family: Family | null;
  children: Child[];
  childId: string | null; // For child-role users
  familyId: string | null;
}

async function fetchFamilyData(userId: string): Promise<FamilyDataResult> {
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('family_id, child_id, role')
    .eq('user_id', userId);

  if (rolesError) {
    console.error('[useFamilyData] Failed to fetch user_roles:', rolesError);
    throw rolesError;
  }
  if (!roles || roles.length === 0) {
    console.warn('[useFamilyData] No roles found for user', userId);
    return { role: null, family: null, children: [], childId: null, familyId: null };
  }

  // Prioritize child role if user has both (handles edge case of legacy/duplicate roles)
  const childRole = roles.find(r => r.role === 'child' && r.child_id);
  const userRoleData = childRole || roles[0];
  const role = userRoleData.role as 'parent' | 'child';
  let familyId: string | null = userRoleData.family_id;

  if (!familyId && userRoleData.child_id) {
    const { data: childData, error: childError } = await supabase
      .from('children')
      .select('family_id')
      .eq('id', userRoleData.child_id)
      .single();
    if (childError) throw childError;
    familyId = childData?.family_id || null;
  }

  if (!familyId) {
    return { role, family: null, children: [], childId: userRoleData.child_id, familyId: null };
  }

  // Fetch family and children in parallel
  const [familyRes, childrenRes] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).maybeSingle(),
    supabase.from('children').select('*').eq('family_id', familyId).order('created_at'),
  ]);

  if (familyRes.error) throw familyRes.error;
  if (childrenRes.error) throw childrenRes.error;

  let children = childrenRes.data || [];
  if (role === 'child' && userRoleData.child_id) {
    children = children.filter(c => c.id === userRoleData.child_id);
  }

  return {
    role,
    family: familyRes.data,
    children,
    childId: userRoleData.child_id,
    familyId,
  };
}

export function useFamilyData(userId: string | undefined) {
  return useQuery({
    queryKey: ['family-data', userId],
    queryFn: () => fetchFamilyData(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
  });
}
