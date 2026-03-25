

## Plan: Stripe-prenumeration med Free Tier, Avbokningshantering & Prissida

### Prenumerationsmodell

| | Gratis | Betald (49 kr/mån eller 490 kr/år) |
|---|---|---|
| Max familjemedlemmar | 6 | 6 |
| Läxor per barn | Max 3 aktiva | Obegränsat |
| Alla övriga funktioner | Ja | Ja |

### Subscription Status-flöde

```text
[Ny familj] → free
[Betalar] → active
[Avbryter] → canceled (behåller access till period slutar)
[Period slut] → free (begränsningar aktiveras)
[Manuellt gratis] → gifted (behandlas som active)
```

**Avbokningslogik:** Status `canceled` behandlas som `free` efter `subscription_end_date` passerat.

### Databasändringar

Nya kolumner på `families`:
- `subscription_status` (text, default `'free'`)
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `subscription_end_date` (timestamptz, nullable)

### Edge Functions

1. **create-checkout-session** — Stripe Checkout med månads/årspris i SEK
2. **stripe-webhook** — Hanterar betalning klar, avbruten, misslyckad
3. **cancel-subscription** — Avbryter via Stripe API
4. **customer-portal** — Stripe kundportal

### Landningssida — Prissektion

Uppdatera `/landing` (`src/pages/LandingPage.tsx`) med en tydlig prissektion:

- **Tre kolumner/kort**: Gratis, Månadsplan, Årsplan
- **Gratis-kortet**: Visar begränsningar (3 läxor/barn), ingen knapp eller "Kom igång gratis"
- **Månadskortet**: 49 kr/mån, obegränsat, enkel CTA
- **Årskortet**: 490 kr/år, markerat som "Bäst värde" / "Spara 2 månader", visuellt framhävt med border/badge/bakgrund, primär CTA-knapp
- Årskortet ska vara det visuellt dominanta (större, annan färg, "Populärast"-badge)
- Kort lista med vad som ingår i betalversionen vs gratis
- CTA-knappar leder till registrering (om utloggad) eller Stripe Checkout (om inloggad)

### Frontend-ändringar (övrigt)

- **`src/hooks/useFamily.ts`**: Exponera `isSubscribed`, räkna aktiva läxor
- **`src/components/AddHomework.tsx`**: Blockera vid ≥3 aktiva + ej prenumerant, visa uppgradera-CTA
- **`src/components/UpgradeModal.tsx`**: Ny — prisval med redirect till Stripe Checkout
- **`src/pages/FamilyPage.tsx`**: Visa status, uppgradera/avsluta-knapp

### Filer att skapa/ändra
- `supabase/migrations/` — families-kolumner
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/cancel-subscription/index.ts`
- `src/hooks/useFamily.ts`
- `src/components/UpgradeModal.tsx` (ny)
- `src/components/AddHomework.tsx`
- `src/pages/FamilyPage.tsx`
- `src/pages/LandingPage.tsx` — ny prissektion

### Första steg
1. Aktivera Stripe-integrationen i Lovable
2. Skapa databaskolumner
3. Implementera edge functions + frontend + prissida

