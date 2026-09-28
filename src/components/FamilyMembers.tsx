import { useState, useEffect, type ReactNode } from 'react';
import { FAMILY_MEMBERS_CHANGED } from '@/components/ChildLoginSetup';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, ShieldOff, UserX, Users, ChevronDown, ChevronUp, KeyRound, Copy, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;

interface FamilyMember {
  user_id: string;
  email: string;
  role: 'parent' | 'child' | 'admin';
  child_id: string | null;
  blocked: boolean;
  child_name: string | null;
}

interface FamilyMembersProps {
  familyId: string;
  children: Child[];
  inviteCode?: string | null;
  onAddChild?: () => void;
  renderChildren?: (linkedByChild: Record<string, FamilyMember>) => ReactNode;
}

export function FamilyMembers({ familyId, children, inviteCode, onAddChild, renderChildren }: FamilyMembersProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [resetTarget, setResetTarget] = useState<FamilyMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    if (!resetTarget || newPassword.length < 6) {
      toast.error('Lösenord måste vara minst 6 tecken');
      return;
    }
    setResetting(true);
    const body: Record<string, string> = { password: newPassword };
    if (resetTarget.role === 'child' && resetTarget.child_id) {
      body.childId = resetTarget.child_id;
    } else {
      body.targetUserId = resetTarget.user_id;
    }
    const { data, error } = await supabase.functions.invoke('reset-child-password', { body });
    setResetting(false);
    if (error || (data as any)?.error) {
      toast.error('Kunde inte återställa lösenord: ' + (error?.message || (data as any)?.error));
      return;
    }
    toast.success(`Lösenord återställt för ${resetTarget.email}`);
    setResetTarget(null);
    setNewPassword('');
  };

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
    const h = () => fetchMembers();
    window.addEventListener(FAMILY_MEMBERS_CHANGED, h);
    return () => window.removeEventListener(FAMILY_MEMBERS_CHANGED, h);
  }, [familyId, children.length]);

  const linkedByChild: Record<string, FamilyMember> = {};
  members.forEach((m) => {
    if (m.role === 'child' && m.child_id && !m.email.endsWith('@laxhjalpen.child')) linkedByChild[m.child_id] = m;
  });
  // Only hide username-based child accounts (managed from the child card).
  // Email accounts linked to a child stay listed so they can be unlinked, blocked or removed.
  const adults = members.filter(
    (m) => !(m.role === 'child' && m.child_id && m.email.endsWith('@laxhjalpen.child'))
  );
  const unlinkedCount = adults.filter((m) => m.role === 'child' && !m.child_id).length;

  const handleRoleChange = async (memberId: string, newRole: 'parent' | 'child') => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole } as any)
      .eq('user_id', memberId)
      .eq('family_id', familyId);

    if (error) {
      toast.error('Kunde inte ändra roll');
      return;
    }
    
    // If changing to child, clear child_id so user is prompted to link
    if (newRole === 'child') {
      toast.success('Roll ändrad till barn – välj vilken barnprofil att koppla');
    } else {
      // If changing to parent, clear child_id link
      await supabase
        .from('user_roles')
        .update({ child_id: null } as any)
        .eq('user_id', memberId)
        .eq('family_id', familyId);
      toast.success('Roll ändrad till förälder');
    }
    fetchMembers();
  };

  const handleToggleBlock = async (memberId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ blocked: !currentlyBlocked } as any)
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
      .update({ child_id: childId === 'none' ? null : childId } as any)
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
    const { data, error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', memberId)
      .eq('family_id', familyId)
      .select();

    if (error) {
      toast.error('Kunde inte ta bort medlem: ' + error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.error('Inget togs bort. Du kan inte ta bort dig själv eller saknar behörighet.');
      return;
    }
    toast.success(`Medlem borttagen (${data.length} roll${data.length > 1 ? 'er' : ''})`);
    fetchMembers();
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-card shadow-card">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="font-bold">Familjen</h2>
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
          <h2 className="font-bold">Familjen</h2>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            {adults.length + children.length}
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
          <h3 className="text-sm font-semibold text-muted-foreground">Konton</h3>
          {unlinkedCount > 0 && (
            <p className="text-xs text-primary">⚠️ Någon har gått med som barn men är inte kopplad – välj barnprofil nedan.</p>
          )}
          {adults.map((member) => {
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
                      <div className={`flex-1 min-w-[120px] ${!member.child_id ? 'ring-2 ring-primary/50 rounded-md' : ''}`}>
                        <Select
                          value={member.child_id || 'none'}
                          onValueChange={(val) => handleChildLink(member.user_id, val)}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="⚠️ Välj barnprofil..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ingen koppling</SelectItem>
                            {children.map((child) => (
                              <SelectItem key={child.id} value={child.id}>
                                <span className="flex items-center gap-1">
                                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: child.color }} />
                                  {child.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!member.child_id && (
                          <p className="text-xs text-primary mt-1">⚠️ Koppla till barnprofil så läxorna visas rätt</p>
                        )}
                      </div>
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
                      className="h-8 text-xs"
                      onClick={() => { setResetTarget(member); setNewPassword(''); }}
                    >
                      <KeyRound className="w-3 h-3 mr-1" />
                      Nytt lösenord
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
          {renderChildren && (
            <>
              <div className="flex items-center justify-between pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Barn</h3>
                {onAddChild && (
                  <Button variant="ghost" size="sm" onClick={onAddChild}>
                    <Plus className="w-4 h-4 mr-1" /> Lägg till barn
                  </Button>
                )}
              </div>
              {renderChildren(linkedByChild)}
            </>
          )}
          {inviteCode && (
            <div className="p-3 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground mb-1">Bjud in fler med familjens kod</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xl font-mono font-bold tracking-widest">{inviteCode.toUpperCase()}</code>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Kopiera inbjudningskod"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    setCopied(true);
                    toast.success('Inbjudningskod kopierad!');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Återställ lösenord</DialogTitle>
            <DialogDescription>
              Sätt ett nytt lösenord för {resetTarget?.email}. Minst 6 tecken.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-pwd">Nytt lösenord</Label>
            <Input
              id="new-pwd"
              type="text"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minst 6 tecken"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetTarget(null)}>Avbryt</Button>
            <Button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6}>
              {resetting ? 'Sparar...' : 'Spara lösenord'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
