import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, ShieldOff, UserX, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;

interface FamilyMember {
  user_id: string;
  email: string;
  role: 'parent' | 'child';
  child_id: string | null;
  blocked: boolean;
  child_name: string | null;
}

interface FamilyMembersProps {
  familyId: string;
  children: Child[];
}

export function FamilyMembers({ familyId, children }: FamilyMembersProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchMembers = async () => {
    const { data, error } = await supabase.rpc('get_family_members', {
      _family_id: familyId,
    });
    if (error) {
      console.error('Error fetching members:', error);
      return;
    }
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [familyId]);

  const handleRoleChange = async (memberId: string, newRole: 'parent' | 'child') => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', memberId)
      .eq('family_id', familyId);

    if (error) {
      toast.error('Kunde inte ändra roll');
      return;
    }
    toast.success('Roll uppdaterad');
    fetchMembers();
  };

  const handleToggleBlock = async (memberId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ blocked: !currentlyBlocked })
      .eq('user_id', memberId)
      .eq('family_id', familyId);

    if (error) {
      toast.error('Kunde inte uppdatera');
      return;
    }
    toast.success(currentlyBlocked ? 'Användare avblockerad' : 'Användare blockerad');
    fetchMembers();
  };

  const handleChildLink = async (memberId: string, childId: string | null) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ child_id: childId === 'none' ? null : childId })
      .eq('user_id', memberId)
      .eq('family_id', familyId);

    if (error) {
      toast.error('Kunde inte länka barn');
      return;
    }
    toast.success('Barnprofil uppdaterad');
    fetchMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', memberId)
      .eq('family_id', familyId);

    if (error) {
      toast.error('Kunde inte ta bort medlem');
      return;
    }
    toast.success('Medlem borttagen från familjen');
    fetchMembers();
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-card shadow-card">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="font-bold">Familjemedlemmar</h2>
        </div>
        <div className="mt-3 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-card shadow-card"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="font-bold">Familjemedlemmar</h2>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            {members.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.user_id === user?.id;

            return (
              <div
                key={member.user_id}
                className={`p-3 rounded-xl border ${
                  member.blocked
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {member.email}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-muted-foreground">(du)</span>
                      )}
                    </p>
                    {member.child_name && (
                      <p className="text-xs text-muted-foreground">
                        Länkad till: {member.child_name}
                      </p>
                    )}
                    {member.blocked && (
                      <p className="text-xs text-destructive font-medium">Blockerad</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      member.role === 'parent'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-accent/20 text-accent-foreground'
                    }`}
                  >
                    {member.role === 'parent' ? 'Förälder' : 'Barn'}
                  </span>
                </div>

                {!isCurrentUser && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Select
                      value={member.role}
                      onValueChange={(val) =>
                        handleRoleChange(member.user_id, val as 'parent' | 'child')
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Förälder</SelectItem>
                        <SelectItem value="child">Barn</SelectItem>
                      </SelectContent>
                    </Select>

                    {member.role === 'child' && (
                      <Select
                        value={member.child_id || 'none'}
                        onValueChange={(val) => handleChildLink(member.user_id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1 min-w-[120px]">
                          <SelectValue placeholder="Länka barn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ingen</SelectItem>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      variant={member.blocked ? 'outline' : 'ghost'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleToggleBlock(member.user_id, member.blocked)}
                    >
                      {member.blocked ? (
                        <>
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Avblockera
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Blockera
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      <UserX className="w-3 h-3 mr-1" />
                      Ta bort
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
