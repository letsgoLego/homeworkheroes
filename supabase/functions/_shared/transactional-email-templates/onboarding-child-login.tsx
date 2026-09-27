/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { OnboardingEmail } from './onboarding-layout.tsx'

const Email = ({ childName, username }: { childName?: string; username?: string }) => {
  const n = childName || 'Barnet'
  return (
    <OnboardingEmail
      preview={`${n} kan nu logga in – lägg in första läxan`}
      heading={`${n} kan nu logga in! 🔑`}
      intro={`${n} har nu en egen inloggning. Nästa steg är att lägga in den första läxan.`}
      steps={[
        { title: 'Så loggar barnet in', body: `Öppna laxhjalp.app, välj fliken "Barnkonto" och logga in${username ? ` med användarnamnet ${username}` : ' med användarnamnet'} och lösenordet du valde.` },
        { title: 'Lägg in första läxan', body: 'Tryck på plusknappen, välj ämne och deadline. Sedan väljer du vilka dagar det ska pluggas – eller låter barnet planera själv via inkorgen.', link: { href: 'https://laxhjalp.app/tips/planera-laxor-foraldrar', label: 'Läs: så planerar ni läxor tillsammans' } },
      ]}
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `${d.childName || 'Barnet'} kan nu logga in i Läxhjälp`,
  displayName: 'Uppstart: barninloggning skapad',
  previewData: { childName: 'Tuva', username: 'tuva' },
} satisfies TemplateEntry
