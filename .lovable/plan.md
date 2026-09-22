# Adminvy för dig

En egen sida, `/admin`, som bara ditt konto (elias.nordblad@gmail.com) kommer åt. Den visar hur appen växer – totalt och jämfört med förra månaden.

## Vad du ser

**Nyckeltal (kort med siffra + förändring mot förra månaden)**
- Användare (konton totalt, och nya denna månad)
- Familjer
- Barn
- Läxor
- Aktiva användare (inloggade senaste 7 respektive 30 dagarna)
- Aktiva barn (barn som varit inne i appen senaste 7 dagarna)
- Avbockade pluggmoment (visar att appen faktiskt används)

Varje kort visar t.ex. "12 familjer · +3 mot förra månaden" med grön/röd pil.

**Trend**
Ett enkelt stapeldiagram per månad de senaste 6 månaderna: nya familjer, nya läxor och antal inloggningar.

**Senaste familjerna**
Lista med de 10 senast skapade familjerna: namn, antal barn, antal läxor, om barnkonto finns, senast sedd aktivitet. Så du snabbt ser vilka som fastnat direkt efter registrering.

Allt på svenska, samma teal-design som resten av appen, och länk till sidan bara för dig (inget syns för andra).

## Teknisk plan

1. **Adminroll**: lägg till `admin` i `app_role`-enumet och en rad i `user_roles` för ditt användar-id. Rollen kontrolleras server-side via befintliga `has_role`, aldrig på e-post i klienten.
2. **Statistik-RPC**: en security-definer-funktion `get_admin_stats()` som först kräver `has_role(auth.uid(), 'admin')` och annars kastar fel. Den returnerar en `jsonb` med totalsummor, denna månad, förra månaden, 6 månaders serie och de 10 senaste familjerna (aggregerat – inga personuppgifter utöver familjenamn, barnnamn och e-post som du redan ser i din data). `GRANT EXECUTE ... TO authenticated`.
3. **Ny sida** `src/pages/AdminPage.tsx` + route `/admin` bakom `ProtectedRoute` och en ny `AdminRouteGuard` som skickar icke-admin till `/`. Data hämtas med React Query mot RPC:n.
4. **Diagram** med `recharts` (redan i projektet) och `Card`-komponenterna från shadcn.
5. Diskret länk till `/admin` på profilsidan, synlig bara när rollen är admin.

Inga ändringar i befintliga tabeller eller i appens vanliga flöden.
