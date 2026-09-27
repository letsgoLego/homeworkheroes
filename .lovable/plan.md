# Uppstartsmejl som guidar föräldern framåt

## Viktig begränsning
Mejlen får bara skickas **direkt när föräldern gör något** i appen, till exempel lägger till ett barn. Det är tillåtet eftersom mejlet bekräftar det man just gjort och visar nästa steg.
Påminnelser som skickas senare för att man *inte* har gjort något ("Du har inte lagt in en läxa än…") räknas som marknadsföring och stöds inte. De skadar också möjligheten att få fram mejl till inkorgen. Därför skickas varje mejl direkt i samband med steget.

## De fem stegen och deras mejl
Varje mejl skickas högst en gång per familj.

| Steg föräldern gör | Mejl | Innehåll |
|---|---|---|
| Skapar konto + familj | Välkommen (finns redan, uppdateras) | Vad appen gör. Nästa steg: lägg till ditt barn |
| Lägger till första barnet | "{Barn} är tillagd" | Nästa steg: skapa inloggning åt barnet, med instruktion |
| Skapar första barninloggningen | "{Barn} kan nu logga in" | Hur barnet loggar in (användarnamn på fliken Barnkonto). Nästa steg: lägg in första läxan |
| Lägger in första läxan | "Första läxan är inlagd" | Hur pluggdagar och studietekniken med tre faser fungerar, och att barnet bockar av |
| Lägger in tredje läxan (aktiv användare) | "Tips för dig som kommit igång" | Aktiviteter, packlista, återkommande läxor och Lov-läge, med länkar till guiderna på /tips |

## Återkommer i varje mejl
En ruta med rubriken "Ha Läxhjälp på hemskärmen":
- **iPhone:** öppna laxhjalp.app i Safari, tryck på Dela och välj "Lägg till på hemskärmen".
- **Android:** öppna i Chrome, tryck på menyn och välj "Installera app" eller "Lägg till på startskärmen".
- **iPad:** fungerar nu fullt ut med meny på sidan och två kolumner, och läggs till på samma sätt som på iPhone.

Mejlen har också en knapp "Öppna Läxhjälp", i appens turkosa färg.

## Tekniskt
- Nya mallar i `_shared/transactional-email-templates/`:
  - `onboarding-child-added`
  - `onboarding-child-login`
  - `onboarding-first-homework`
  - `onboarding-power-tips`
- Den befintliga `welcome-parent` får också hemskärmsrutan. Allt registreras i `registry.ts`.
- En gemensam del `HomeScreenSection` används i alla mallarna.
- Ny funktion för de här mejlen: `send-onboarding-email`, som kräver inloggning (JWT verifieras).
  - Den tar bara emot `step`, som måste vara ett av de fyra kända stegen.
  - Mottagaren är alltid den inloggade föräldern.
  - Funktionen kontrollerar i databasen att steget faktiskt har hänt: barn finns, barnkonto finns, antal läxor är 1 respektive minst 3.
  - Mallen bestäms av funktionen och inte av webbläsaren.
  - Idempotensnyckeln är `onboarding-${step}-${familyId}` och gör att samma mejl aldrig skickas två gånger.
- Anrop görs från klienten i bakgrunden, utan att blockera appen:
  - Efter `addChild`.
  - Efter att barnkontot har skapats eller kopplats (i `ChildLoginSetup`).
  - Efter att en läxa har skapats eller skickats. Funktionen avgör själv om det var första eller tredje läxan.
- Egen `deno.json` och en post i `config.toml` med `verify_jwt = true`. Funktionen driftsätts tillsammans med `preview-transactional-email`.
- Inga databasändringar.
