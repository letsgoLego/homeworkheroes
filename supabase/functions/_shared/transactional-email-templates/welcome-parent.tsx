/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'

interface WelcomeParentProps {
  familyName?: string
  childName?: string
}

const steps = (childName?: string) => [
  {
    title: '1. Skapa ett barnkonto',
    body: childName
      ? `Ge ${childName} en egen inloggning så hen kan bocka av läxor själv – och du ser framstegen direkt.`
      : 'Ge barnet en egen inloggning så hen kan bocka av läxor själv – och du ser framstegen direkt.',
  },
  {
    title: '2. Slå på påminnelser',
    body: 'Små puffar på eftermiddagen gör att läxorna blir gjorda utan tjat.',
  },
  {
    title: '3. Lägg in första läxan',
    body: 'Välj ämne och datum – Läxhjälp delar upp den i lagom stora pluggdagar.',
  },
]

const WelcomeParentEmail = ({ familyName, childName }: WelcomeParentProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Tre snabba steg för att komma igång med Läxhjälp</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Välkommen till Läxhjälp! 📚</Heading>
        <Text style={text}>
          {familyName
            ? `Kul att ${familyName} är på plats!`
            : 'Kul att du är på plats!'}{' '}
          Här är tre snabba steg som gör vardagen med läxor mycket lugnare.
        </Text>

        {steps(childName).map((s) => (
          <Section key={s.title} style={card}>
            <Text style={cardTitle}>{s.title}</Text>
            <Text style={cardBody}>{s.body}</Text>
          </Section>
        ))}

        <Button style={button} href="https://laxhjalp.app/">
          Fortsätt där du slutade
        </Button>

        <Text style={footer}>
          Har du en fråga? Svara bara på det här mejlet – vi läser allt.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeParentEmail,
  subject: 'Kom igång med Läxhjälp – 3 snabba steg',
  displayName: 'Välkomstmejl (förälder)',
  previewData: { familyName: 'Familjen Svensson', childName: 'Tuva' },
} satisfies TemplateEntry

export default WelcomeParentEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Nunito, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#293549',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const card = {
  backgroundColor: '#f4fbfa',
  borderRadius: '16px',
  padding: '16px 18px',
  margin: '0 0 12px',
}
const cardTitle = {
  fontSize: '15px',
  fontWeight: 'bold' as const,
  color: '#293549',
  margin: '0 0 6px',
}
const cardBody = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '0',
}
const button = {
  backgroundColor: '#20c4b6',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '16px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '20px 0 0',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
