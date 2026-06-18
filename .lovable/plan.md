## Mål

1. Säkerställ att Google + Apple SSO fungerar för både inloggning och kontoskapande.
2. När någon försöker logga in med e-post/lösenord men saknar konto: erbjud opt-in att skapa ett konto med samma uppgifter direkt.

## Bakgrund

- SSO går idag via `lovable.auth.signInWithOAuth('google' | 'apple', …)` i `AuthPage.tsx`. Samma knapp används för login och signup (OAuth skapar konto automatiskt vid första inlog). Etiketten ändras redan ("Fortsätt med…" vs "Kom igång med…").
- Auto-linking för matchande verifierad e-post finns redan (mem://auth/account-linking).
- Vid inloggningsfel returnerar Supabase generiskt `Invalid login credentials` — vi kan inte säkert särskilja "fel lösenord" från "konto saknas". Vi visar därför ett opt-in-erbjudande istället för automatiskt skapande.

## Plan

### 1. SSO-verifiering (`AuthPage.tsx`, `ChildLoginPage` rörs ej)
- Behåll en delad `handleOAuth` — bekräftar att login- och signup-flikarna båda använder samma broker (korrekt beteende: OAuth = upsert-konto).
- Lägg till en liten hjälptext under SSO-knapparna: "Samma knapp fungerar både för nya och befintliga konton." (svensk, dämpad text-muted-foreground, syns i båda vyer).
- Inga ändringar i `src/integrations/lovable/index.ts` (auto-genererad).

### 2. Opt-in "skapa konto" vid misslyckad inloggning
När `signInWithPassword` returnerar `Invalid login credentials` i login-vyn:
- Byt nuvarande toast mot en `AlertDialog` (shadcn) med:
  - Titel: "Inget konto hittades – eller fel lösenord"
  - Text: "Vill du skapa ett konto med samma e-post och lösenord? Du loggas in direkt om det går."
  - Primär: "Skapa konto" → kör `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/' } })` med samma värden.
    - Om `data.session` finns → `navigate('/onboarding')`.
    - Om e-postbekräftelse krävs → växla till `email-sent`-vyn.
    - Om felet säger "already registered" → toast "E-posten finns redan – kontrollera lösenordet" och stäng dialogen.
  - Sekundär: "Försök igen" → stäng dialog, behåll email-fältet ifyllt.
  - Tertiär (länk): "Glömt lösenord?" → `/forgot-password`.
- Dialogen visas ENDAST i login-vyn, ENDAST vid `Invalid login credentials`. Andra fel (t.ex. email not confirmed) behåller dagens beteende.

### 3. Tester (`src/pages/__tests__/AuthFlow.test.tsx`)
Lägg till:
- "Login with invalid credentials shows opt-in dialog and confirming creates account" → mocka `signInWithPassword` → felresponse, klicka "Skapa konto", verifiera `signUp` anropas med samma email+password och navigering till `/onboarding`.
- "Confirming opt-in when email confirmation required shows inbox screen".
- (Befintliga tester förblir gröna — behåll förväntad svensk text i toast för andra fel.)

## Tekniska detaljer

Filer som ändras:
- `src/pages/AuthPage.tsx` — lägg till `AlertDialog`-state (`showCreateOptIn`), refaktorera `Invalid login credentials`-grenen, lägg till hjälptext under SSO.
- `src/pages/__tests__/AuthFlow.test.tsx` — nya testfall.

Filer som INTE rörs:
- `src/integrations/lovable/index.ts`, `src/integrations/supabase/client.ts` (auto-genererade)
- `ChildLoginPage.tsx` (barnkonton, ingen SSO)
- DB-schema, edge functions, OAuth-konfiguration (Google/Apple-providers är redan konfigurerade enligt mem://auth/social-login).

Inga nya beroenden. `AlertDialog` finns redan i `src/components/ui/alert-dialog.tsx`.
