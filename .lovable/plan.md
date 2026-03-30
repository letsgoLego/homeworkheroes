

## Plan: Onboarding-flöde, Offline-stöd & React Query-optimering

### 1. Förbättrat onboarding-flöde

Nuvarande onboarding har bara 2 steg (skapa familj → lägg till barn). Vi bygger ut det med:

- **Steg-indikator (progress bar)** högst upp som visar 1/3, 2/3, 3/3
- **Steg 1: Välkommen** — kort intro som förklarar vad appen gör (3 USP:er med ikoner)
- **Steg 2: Skapa familj** — behåller nuvarande familjenamn-funktionalitet
- **Steg 3: Lägg till barn** — behåller nuvarande barn-funktionalitet

Dessutom: en **intro-tour för befintliga användare** som visas första gången man landar på TodayPage. En enkel tooltip-overlay som visar 3-4 steg ("Här ser du dagens uppgifter", "Byt barn här", "Lägg till läxor här"). Sparas i `localStorage` så den bara visas en gång.

**Filer:**
- `src/pages/OnboardingPage.tsx` — lägg till välkomststeg + progress bar
- `src/components/IntroTour.tsx` — ny komponent för tooltip-overlay
- `src/pages/TodayPage.tsx` — visa IntroTour för nya användare

### 2. Offline-stöd

PWA med service worker finns redan (`vite-plugin-pwa` + `sw-push.js`). Vi förbättrar med:

- **Runtime caching av API-anrop**: Lägg till `runtimeCaching` i workbox-konfigurationen för att cacha Supabase-anrop med en `NetworkFirst`-strategi (försök nätverk först, falla tillbaka till cache)
- **Offline-indikator**: En liten banner som visas överst i appen när enheten tappar uppkoppling (`navigator.onLine` + event listeners)
- **Statiska tillgångar**: Redan cachade via `globPatterns`, men vi utökar med fonter och bilder
- **Guard mot iframe/preview**: Lägg till registreringsguard i `main.tsx` så SW inte registreras i Lovable-editorn

**Filer:**
- `vite.config.ts` — lägg till `runtimeCaching` + `devOptions: { enabled: false }`
- `src/main.tsx` — lägg till SW-registreringsguard
- `src/components/OfflineBanner.tsx` — ny komponent
- `src/App.tsx` — inkludera OfflineBanner

### 3. React Query-optimering

Appen har `@tanstack/react-query` installerad men använder den inte. `useFamily` gör all datahämtning manuellt med `useState`/`useEffect`. Vi migrerar till React Query för:

- **Automatisk caching** — data behöver inte hämtas om vid navigering
- **Stale-while-revalidate** — visar cachad data direkt, uppdaterar i bakgrunden
- **Retry-logik** — automatisk omförsök vid nätverksfel
- **Deduplicering** — flera komponenter som begär samma data gör bara ett anrop

**Approach:** Refaktorera `useFamily` till att internt använda `useQuery` för datahämtning, men behålla samma externa API (return-värden). Alla sidor fortsätter importera `useFamily()` som förut.

Delas upp i queries:
- `useFamilyData(userId)` — hämtar roll, familj, barn
- `useHomeworkData(childIds)` — hämtar läxor + study_tasks
- `usePackItems(childIds)` — hämtar recurring pack items
- `useAdhocTasks(childIds)` — hämtar adhoc tasks

Mutationer (toggleTask, addHomework etc.) använder `useMutation` med optimistic updates.

**Filer:**
- `src/hooks/useFamily.ts` — stor refaktorering till React Query
- `src/hooks/queries/useFamilyData.ts` — ny
- `src/hooks/queries/useHomeworkData.ts` — ny

### Sammanfattning av alla filer

| Fil | Åtgärd |
|---|---|
| `src/pages/OnboardingPage.tsx` | Utöka med välkomststeg + progress |
| `src/components/IntroTour.tsx` | Ny — tooltip-tour |
| `src/pages/TodayPage.tsx` | Lägg till IntroTour |
| `vite.config.ts` | Runtime caching + dev guard |
| `src/main.tsx` | SW-registreringsguard |
| `src/components/OfflineBanner.tsx` | Ny — offline-indikator |
| `src/App.tsx` | Lägg till OfflineBanner |
| `src/hooks/useFamily.ts` | Refaktorera till React Query |
| `src/hooks/queries/useFamilyData.ts` | Ny — familjedata-query |
| `src/hooks/queries/useHomeworkData.ts` | Ny — läxdata-query |

