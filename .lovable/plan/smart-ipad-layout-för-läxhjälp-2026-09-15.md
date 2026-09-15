# Smart iPad-layout för Läxhjälp

## Mål
Behåll den nuvarande mobilupplevelsen på iPhone, men låt iPad och större skärmar använda en fast sidomeny, tydliga innehållsytor och två kolumner där innehållet passar ihop.

## Förändringar

### Gemensam struktur
- Byt bottenmenyn mot en kompakt sidomeny från iPad-bredd och uppåt; mobilens bottenmeny lämnas oförändrad.
- Sidomenyn visar samma val, aktiv sida och inkorgsmärke som idag, med ”Lägg till” som tydlig huvudåtgärd.
- Lägg sidhuvud och innehåll i en gemensam, centrerad maxbredd så att innehållet varken sträcks ut eller lämnar ytan oanvänd.
- Anpassa barnväljaren för större skärm utan onödig horisontell rullning.

### Idag och Lov-läge
- Dela ”Idag” i en bred huvudkolumn för dagens uppgifter och en smalare kolumn för aktiviteter, förberedelser och kommande läxor.
- Låt flikarna Streak och Packa använda bredare, balanserade paneler på iPad.
- Visa lovmål och uppföljning i två kolumner när utrymmet finns.

### Vecka
- Ersätt den utdragna mobillistan med en överskådlig veckoyta på större skärm.
- Visa veckans dagar i ett responsivt rutnät så att läxor, moment, deadlines och aktiviteter kan jämföras utan att förstoras oproportionerligt.
- Behåll mobilens vertikala lista på små skärmar.

### Läxor
- Behåll snabbvalen överst och dela därefter upp innehållet i två logiska kolumner, exempelvis läxor och aktiviteter.
- Visa läxkort och aktivitetskort i en tätare, lättskannad struktur utan att ändra funktionerna för att skapa, redigera eller ta bort.
- Ge formulären en lämplig bredd och bättre kolumnindelning på iPad, men behåll samma steg och data.

### Familj, profil och insikter
- Gruppera familjeinställningar, barn och kontoåtgärder i två kolumner för kortare rullning.
- Visa profilens statistik och inställningar sida vid sida där det är naturligt.
- Gör Insikter till en iPad-anpassad översikt med statistik- och diagramblock i ett tvåkolumnsrutnät, medan breda diagram får hela bredden.

## Tekniskt
- Använd befintliga färger, typografi, kort och komponenter; ingen visuell omprofilering.
- Inför en återanvändbar responsiv appsida för sidomeny, maxbredd, sidhuvud och huvudområde.
- Använd projektets befintliga brytpunkter och CSS-klasser; ingen separat iPad-kodväg och ingen ändring av affärslogik eller data.
- Säkerställ att dialoger och formulär ryms i både stående och liggande iPad-läge med intern rullning vid behov.

## Kontroll
- Kontrollera iPhone, stående iPad, liggande iPad och bred datorskärm.
- Verifiera att navigering, inkorgsmärke, barnbyte, flikar, formulär och kort fungerar som tidigare.
- Kontrollera att text, knappar och paneler inte överlappar och att inget innehåll hamnar bakom sidomenyn eller skärmens säkra ytor.
