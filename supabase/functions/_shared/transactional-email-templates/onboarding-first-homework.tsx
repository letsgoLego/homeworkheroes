/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { OnboardingEmail } from './onboarding-layout.tsx'

const Email = ({ childName }: { childName?: string }) => (
  <OnboardingEmail
    preview="Första läxan är inlagd – så här fungerar det sen"
    heading="Första läxan är inlagd! 🎉"
    intro="Nu är ni igång. Så här fungerar det framåt:"
    steps={[
      { title: 'Pluggdagar', body: `Läxan delas upp på de dagar ni valt. ${childName || 'Barnet'} ser dagens uppgifter direkt på startsidan.` },
      { title: 'Studieteknik i tre faser', body: 'Vid förhör och prov kan ni följa en mall: Förstå, Träna, Repetera – byggd på forskning som Skolverket sprider om testbaserat lärande och spridd repetition.', link: { href: 'https://laxhjalp.app/tips/studieteknik-barn', label: 'Läs mer om studieteknik' } },
      { title: 'Bocka av', body: 'När en uppgift är gjord bockar barnet av den – och du ser framstegen i appen.' },
    ]}
  />
)

export const template = {
  component: Email,
  subject: 'Första läxan är inlagd – så fungerar Läxhjälp',
  displayName: 'Uppstart: första läxan',
  previewData: { childName: 'Tuva' },
} satisfies TemplateEntry
