/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'

interface HelpQuestionProps {
  email?: string
  message?: string
  createdAt?: string
}

const HelpQuestionEmail = ({ email, message, createdAt }: HelpQuestionProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Ny hjälpfråga från {email || 'en användare'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ny fråga från Läxhjälp 💬</Heading>
        <Text style={text}>
          <strong>Från:</strong> {email || 'Okänd användare'}
        </Text>
        {createdAt && (
          <Text style={text}>
            <strong>Skickad:</strong> {createdAt}
          </Text>
        )}
        <Section style={messageBox}>
          <Text style={messageText}>{message}</Text>
        </Section>
        <Text style={footer}>
          Svara direkt på det här mejlet – svaret går till användarens e-postadress.
        </Text>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f6f9fc', fontFamily: 'system-ui, sans-serif' }
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '24px',
  maxWidth: '560px',
  borderRadius: '12px',
}
const h1 = { color: '#0f766e', fontSize: '22px' }
const text = { color: '#334155', fontSize: '14px', lineHeight: '22px' }
const messageBox = {
  backgroundColor: '#f0fdfa',
  borderRadius: '8px',
  padding: '4px 16px',
  margin: '16px 0',
}
const messageText = { color: '#134e4a', fontSize: '15px', lineHeight: '24px' }
const footer = { color: '#64748b', fontSize: '12px', lineHeight: '18px' }

export const template: TemplateEntry = {
  component: HelpQuestionEmail,
  subject: (data) => `Hjälpfråga från ${data.email || 'användare'} – Läxhjälp`,
  displayName: 'Hjälpfråga till ägaren',
  // Fixed recipient: help questions always go to the app owner.
  to: 'elias.nordblad@gmail.com',
  previewData: {
    email: 'foralder@example.se',
    message: 'Hur lägger jag till ett andra barn i appen?',
    createdAt: '22 sep 2026, 18:30',
  },
}
