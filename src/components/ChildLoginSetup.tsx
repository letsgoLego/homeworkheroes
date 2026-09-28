import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerOnboardingEmail } from '@/lib/onboardingEmail';
import { KeyRound, Link2, ArrowLeft, User, Lock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;

interface Member {
  user_id: string;
  email: string;
  role: string;
  child_id: string | null;
}

interface Props {
  child: Child;
  onDone: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

export const FAMILY_MEMBERS_CHANGED = 'family-members-changed';

export function ChildLoginSetup({ child, onDone, onSkip, skipLabel = 'Hoppa över – gör det senare' }: Props) {
  const [mode, setMode] = useState<'choose' | 'create' | 'link'>('choose');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'link') return;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setMyId(auth.user?.id ?? null);
      const [{ data }, { data: fam }] = await Promise.all([
        supabase.rpc('get_family_members', { _family_id: child.family_id }),
        supabase.from('families').select('invite_code').eq('id', child.family_id).maybeSingle(),
      ]);
      setMembers((data as Member[]) || []);
      setInviteCode(fam?.invite_code ?? null);
    })();
  }, [mode, child.family_id]);

  const unlinked = (members || []).filter(
    (m) => m.user_id !== myId && !m.child_id && m.role !== 'admin'
  );

  const handleCreate = async () => {
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      toast.error('Användarnamn måste vara 3-20 tecken (bokstäver, siffror, understreck)');
      return;
    }
    if (password.length < 6) return toast.error('Lösenordet måste vara minst 6 tecken');
    if (password !== confirm) return toast.error('Lösenorden matchar inte');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-child-account', {
        body: { username, password, childId: child.id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) {
        if (data.error === 'Username taken') {
          toast.error('Det användarnamnet är upptaget. Välj ett annat.');
          return;
        }
        throw new Error(String(data.error));
      }
      toast.success(`Konto skapat för ${child.name}! 🎉`);
      window.dispatchEvent(new Event(FAMILY_MEMBERS_CHANGED));
      triggerOnboardingEmail('child-login');
      onDone();
    } catch (e: any) {
      toast.error(e.message || 'Kunde inte skapa konto');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (member: Member) => {
    if (
      member.role === 'parent' &&
      !window.confirm(
        `${member.email} är registrerad som förälder. Vill du verkligen göra kontot till ${child.name}s barnkonto? Du kan ändra tillbaka under Familjen.`
      )
    ) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('user_roles')
      .update({ role: 'child', child_id: child.id } as any)
      .eq('user_id', member.user_id)
      .eq('family_id', child.family_id);
    setLoading(false);
    if (error) return toast.error('Kunde inte koppla kontot');
    toast.success(`${member.email} är nu kopplat till ${child.name}`);
    window.dispatchEvent(new Event(FAMILY_MEMBERS_CHANGED));
      triggerOnboardingEmail('child-login');
    onDone();
  };

  if (mode === 'choose') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setMode('create')}
          className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 text-left flex items-center gap-3"
        >
          <KeyRound className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Skapa användarnamn och lösenord</p>
            <p className="text-xs text-muted-foreground">Bäst för yngre barn utan egen e-post</p>
          </div>
        </button>
        <button
          onClick={() => setMode('link')}
          className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 text-left flex items-center gap-3"
        >
          <Link2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Koppla till ett befintligt konto</p>
            <p className="text-xs text-muted-foreground">Om barnet redan gått med via inbjudningskoden</p>
          </div>
        </button>
        {onSkip && (
          <Button variant="ghost" className="w-full" onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
      </div>
    );
  }

  const back = (
    <Button variant="ghost" size="sm" onClick={() => setMode('choose')} className="-ml-2">
      <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
    </Button>
  );

  if (mode === 'link') {
    return (
      <div className="space-y-3">
        {back}
        {members === null ? (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : unlinked.length === 0 ? (
          <div className="p-4 rounded-xl bg-secondary text-sm space-y-2">
            <p>Det finns inga okopplade konton i familjen ännu.</p>
            {inviteCode && (
              <p>
                Låt {child.name} skapa ett konto och ange koden{' '}
                <code className="font-mono font-bold">{inviteCode.toUpperCase()}</code>. Sedan kan du koppla kontot här.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Välj vilket konto som tillhör {child.name}:</p>
            {unlinked.map((m) => (
              <button
                key={m.user_id}
                disabled={loading}
                onClick={() => handleLink(m)}
                className="w-full p-3 rounded-xl border border-border hover:bg-muted/50 text-left text-sm font-medium truncate"
              >
                {m.email}
                {m.role === 'parent' && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(förälder)</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {back}
      <div>
        <Label htmlFor="cls-username">Användarnamn</Label>
        <div className="relative mt-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="cls-username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="barnets_namn"
            className="pl-9"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">3-20 tecken, bara bokstäver, siffror och understreck</p>
      </div>
      <div>
        <Label htmlFor="cls-pwd">Lösenord</Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="cls-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div>
        <Label htmlFor="cls-pwd2">Bekräfta lösenord</Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="cls-pwd2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-9" />
        </div>
      </div>
      <Button className="w-full" onClick={handleCreate} disabled={loading || !username || !password || !confirm}>
        {loading ? 'Skapar...' : 'Skapa konto'}
      </Button>
    </div>
  );
}
