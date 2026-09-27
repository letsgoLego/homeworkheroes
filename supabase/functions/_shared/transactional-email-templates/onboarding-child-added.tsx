/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { OnboardingEmail } from './onboarding-layout.tsx'

const Email = ({ childName }: { childName?: string }) => {
  const n = childName || 'Barnet'
  return (
    <OnboardingEmail
      preview={`Nästa steg: ge ${n} en egen inloggning`}
      heading={`${n} är tillagd! 👋`}
      intro={`Snyggt! Nästa steg är att ge ${n} en egen inloggning, så kan hen se och bocka av sina läxor själv.`}
      steps={[
        { title: 'Så skapar du inloggningen', body: `Gå till fliken Familj, tryck på "+ Lägg till inloggning" vid ${n} och välj användarnamn och lösenord. Har ${n} redan ett eget konto kan du koppla det istället.` },
        { title: 'Barnet loggar in', body: 'På inloggningssidan väljer barnet fliken "Barnkonto" och skriver sitt användarnamn och lösenord.' },
      ]}
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `${d.childName || 'Barnet'} är tillagd – nästa steg i Läxhjälp`,
  displayName: 'Uppstart: barn tillagt',
  previewData: { childName: 'Tuva' },
} satisfies TemplateEntry
