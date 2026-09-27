/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { OnboardingEmail } from './onboarding-layout.tsx'

const Email = () => (
  <OnboardingEmail
    preview="Fyra funktioner som gör vardagen ännu enklare"
    heading="Tips för dig som kommit igång ⭐"
    intro="Ni har redan lagt in flera läxor – snyggt! Här är funktionerna som våra flitigaste familjer använder:"
    steps={[
      { title: 'Aktiviteter', body: 'Lägg in fotboll, simning och annat. Då syns de i planeringen så ni inte lägger pluggdagar på fullspäckade dagar.' },
      { title: 'Packlista', body: 'Återkommande saker som gympapåse eller simkläder dyker upp på rätt dagar under "Ta med till skolan idag".', link: { href: 'https://laxhjalp.app/tips/skolmaterial-packlista', label: 'Tips: packlista för skolan' } },
      { title: 'Återkommande läxor', body: 'Veckans glosor eller läsläxa? Lägg in den en gång som återkommande läxa.', link: { href: 'https://laxhjalp.app/tips/laxrutin', label: 'Tips: bygg en läxrutin' } },
      { title: 'Lov-läge', body: 'På lovet kan barnet ha 1–3 egna mål, till exempel läsa varje dag, och samla poäng.' },
    ]}
  />
)

export const template = {
  component: Email,
  subject: 'Tips för dig som kommit igång med Läxhjälp',
  displayName: 'Uppstart: tips för vana användare',
  previewData: {},
} satisfies TemplateEntry
