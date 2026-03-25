

## Plan: Stripe-prenumeration med Free Tier, Avbokningshantering & Prissida

### Status: ✅ Implementerad

### Prenumerationsmodell

| | Gratis | Betald (49 kr/mån eller 490 kr/år) |
|---|---|---|
| Max familjemedlemmar | 6 | 6 |
| Läxor per barn | Max 3 aktiva | Obegränsat |
| Alla övriga funktioner | Ja | Ja |

### Subscription Status-flöde

```text
[Ny familj] → free (kontrolleras via Stripe, ingen lokal DB-status)
[Betalar] → active (Stripe subscription active)
[Avbryter] → canceled (behåller access till current_period_end)
[Period slut] → free (ingen aktiv subscription i Stripe)
```

**Avbokningslogik:** Status `canceled` behandlas som `active` så länge `current_period_end` inte passerat. Därefter = `free` med max 3 läxor/barn.

### Arkitektur

Ingen databasändring behövs. Prenumerationsstatus hämtas direkt från Stripe via edge functions.

### Stripe-produkter

- **Månadsplan**: prod_UDKJiGqRFWCPDr / price_1TEtfJ12mugrDSilvyDPiuYu (49 kr/mån)
- **Årsplan**: prod_UDKKIobQvMkm3v / price_1TEtfk12mugrDSilFIUUA2HJ (490 kr/år)

### Edge Functions

1. **check-subscription** — Kontrollerar prenumerationsstatus via Stripe API (active + canceled med tid kvar)
2. **create-checkout** — Skapar Stripe Checkout-session med valt pris
3. **customer-portal** — Öppnar Stripe kundportal för hantering/avbokning

### Frontend-implementering

- **`src/hooks/useSubscription.ts`**: Hook som anropar check-subscription, exponerar `subscribed`, `status`, `subscriptionEnd`, `createCheckout`, `openCustomerPortal`
- **`src/components/UpgradeModal.tsx`**: Prisval (månads/år), redirect till Stripe Checkout
- **`src/components/AddHomework.tsx`**: Blockerar skapande vid ≥3 aktiva läxor + ej prenumerant, visar uppgradera-CTA
- **`src/hooks/useFamily.ts`**: Exponerar `getActiveHomeworkCount(childId)`
- **`src/pages/FamilyPage.tsx`**: Visar prenumerationsstatus, uppgradera/hantera-knapp
- **`src/pages/LandingPage.tsx`**: Prissektion med tre kolumner (Gratis, Månads, Års) — årsplanen visuellt framhävd

### Begränsningslogik

```text
subscribed = Stripe says active OR (canceled AND current_period_end > now)
canCreateHomework = subscribed OR activeHomeworkCount < 3
```
