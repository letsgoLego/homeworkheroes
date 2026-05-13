
# Föräldra-nudge: Peta barnet + engagemangsindikator

## Vad vi bygger

**1. "Peta barnet" 🫵** — knapp på förälderns vy som skickar en push direkt till barnets enhet med ett peppigt meddelande.

**2. Engagemangsindikator 🟢🟡🔴** — liten prick på varje barnkort som visar om barnet öppnat appen idag, så föräldern vet *när* en nudge faktiskt behövs.

---

## Användarflöde

### Peta barnet
- Förälder ser barnets dagsvy (eller barnväljaren) → om barnet har minst en ojord uppgift idag visas en **"Peta 🫵"**-knapp.
- Klick → liten dialog med 3 förvalda tonlägen:
  - 😊 *Snäll*: "Hej älskling, kom ihåg matteläxan 💚"
  - 🚀 *Peppig*: "Du fixar det här! 5 min så är du i mål 🔥"
  - ⏰ *Bestämd*: "Dags att börja med läxan nu, tack!"
- Plus fält för eget kort meddelande (max 80 tecken).
- Skickar push till barnets enhet med titel "Mamma/Pappa petar 🫵" och meddelandet som body. Klick på pushen öppnar appen direkt på dagens lista.
- **Rate-limit**: max 2 petningar per förälder per barn per dag, för att skydda mot tjat.
- Bekräftelse-toast: "Petning skickad ✨"

### Engagemangsindikator
- Liten färgad prick visas på varje barnkort i barnväljaren och förälderns översikt:
  - 🟢 **Grön** — barnet har öppnat appen senaste timmen
  - 🟡 **Gul** — öppnat tidigare idag
  - 🔴 **Röd** — inte öppnat sedan igår eller tidigare
  - ⚪ **Grå** — barnet har inget eget konto än
- Tooltip/lång-tryck: "Senast aktiv: 14:32 idag"

---

## Teknisk plan

### Databas (migration)
1. Ny tabell `nudges`:
   - `id`, `from_user_id`, `to_child_id`, `family_id`, `message`, `tone` (snäll/peppig/bestämd/custom), `created_at`, `delivered` (bool)
   - RLS: föräldrar i samma familj kan INSERT/SELECT
2. Lägg kolumn `last_seen_at timestamptz` på `children` (uppdateras när barnkonto öppnar appen).
3. Trigger eller server-side rate-limit-check (max 2 petningar/förälder/barn/dag).

### Edge function: `nudge-child`
- Tar `child_id` + `message` + `tone`.
- Validerar: anropare är förälder i samma familj, inom rate-limit.
- Hittar barnets `push_subscriptions` (via `user_roles.child_id`).
- Skickar push via befintlig VAPID-logik (återanvänder kod från `send-notifications`).
- Loggar i `nudges`-tabellen.

### Frontend
- **Hook** `useNudge(childId)`: returnerar `sendNudge(message, tone)` + `remainingToday`.
- **Komponent** `NudgeButton.tsx`: knapp + dialog med tonval och eget meddelande.
- Placera i `ChildSwitcher` och/eller på `TodayPage` när förälder är i barnets vy.
- **Hook** `useChildPresence(childId)`: läser `children.last_seen_at`, returnerar status (green/yellow/red/grey).
- **Komponent** `PresenceDot.tsx`: visa pricken med tooltip.
- Heartbeat: när ett barnkonto öppnar appen → uppdatera `children.last_seen_at` (en gång per session, inte varje render).

### Push-payload
Återanvänder befintlig service worker (`sw-push.js`) — bara nytt `tag: "nudge"` och `url: "/"`.

---

## Edge cases & beslut

- **Barn utan konto**: inget push-mål → visa knappen som disabled med tooltip "Barnet behöver ett konto för att kunna petas". Engagemangspricken blir grå.
- **Förälder petar sig själv**: blockera (samma användare).
- **Push avstängd på barnets enhet**: vi kan inte veta säkert; visa knappen ändå men logga "delivered=false" om push misslyckas.
- **Tysta timmar**: ingen petning före 07:00 eller efter 21:00 (server-side check).

---

## Inte med i denna iteration (kommer senare)
- Belöning från förälder ("hejarop tillbaka")
- Streak-hot i auto-pushar
- Gemensam "Vi kör nu"-kickoff med Pomodoro-timer

---

## Leverans
Allt byggs i en omgång. Efter implementation testar vi flödet: förälderns enhet → push på barnets enhet → klick öppnar dagens lista.
