# Enklare barn- och familjehantering

## 1. Lägg till barn – nytt steg 2: inloggning
Efter namn och färg går rutan vidare till steg 2 "Hur ska {namn} logga in?" med tre val:
- **Skapa användarnamn och lösenord** – samma fält som idag i "Skapa inloggning", kontot skapas direkt.
- **Koppla till ett befintligt konto** – lista över familjemedlemmar som gått med via inbjudningskoden men inte är kopplade till en barnprofil. Välj en, så blir den barnets konto (roll Barn + koppling).  Finns ingen visas inbjudningskoden med en kort förklaring.
- **Hoppa över** – barnet kan läggas till utan inloggning (går att göra senare).

Barnet sparas redan i steg 1, så inget tappas om man stänger rutan.

## 2. Familj-sidan – en samlad lista "Familjen"
Ersätter de två separata sektionerna "Barn" och "Familjemedlemmar" med en lista:
- **Vuxna**: föräldrar med e-post, roll, blockera/avblockera.
- **Barn**: varje barnprofil med dagens status, aktiva läxor och inloggningsstatus i samma kort:
  - "Har konto (användarnamn)" eller "Kopplad till e-post" – kugghjulet öppnar hantering (byt lösenord, koppla bort).
  - "Ingen inloggning" – knapp "Lägg till inloggning" som öppnar samma steg 2 som ovan.
- **Okopplade medlemmar** (gått med men inte kopplats) visas överst med tydlig uppmaning: "Är detta en vuxen eller ett barn?" och snabbval.
- En knapp "+ Lägg till barn" och inbjudningskoden längst ner i sektionen.

Barnkonton visas alltså inte längre dubbelt (en gång som barn och en gång som medlem).

## Tekniskt
- `AddChild.tsx`: tvåstegsdialog; steg 2 återanvänder logiken från `ManageChildAccount` (bryts ut till `ChildLoginSetup`) + ny koppla-vy som uppdaterar `user_roles` (role child, child_id) som `FamilyMembers` gör idag.
- `addChild` returnerar det nya barnet så steg 2 har id.
- Ny `FamilyOverview.tsx` som slår ihop `get_family_members` med `children` (matchning via child_id); ersätter barnsektionen i `FamilyPage.tsx` och `FamilyMembers`.
- Inga databasändringar.
