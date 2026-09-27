/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

export const HomeScreenSection = () => (
  <Section style={homeBox}>
    <Text style={cardTitle}>📱 Ha Läxhjälp på hemskärmen</Text>
    <Text style={cardBody}><strong>iPhone:</strong> Öppna laxhjalp.app i Safari, tryck på Dela-knappen och välj "Lägg till på hemskärmen".</Text>
    <Text style={cardBody}><strong>Android:</strong> Öppna laxhjalp.app i Chrome, tryck på menyn (⋮) och välj "Installera app" eller "Lägg till på startskärmen".</Text>
    <Text style={{ ...cardBody, margin: 0 }}><strong>iPad:</strong> Nu fungerar Läxhjälp fullt ut på iPad – med sidomeny och två kolumner. Lägg till den på samma sätt som på iPhone.</Text>
  </Section>
)

export interface Step { title: string; body: string; link?: { href: string; label: string } }

export const OnboardingEmail = ({ preview, heading, intro, steps }: { preview: string; heading: string; intro: string; steps: Step[] }) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{heading}</Heading>
        <Text style={text}>{intro}</Text>
        {steps.map((s) => (
          <Section key={s.title} style={card}>
            <Text style={cardTitle}>{s.title}</Text>
            <Text style={{ ...cardBody, margin: 0 }}>{s.body}</Text>
            {s.link && <Link href={s.link.href} style={link}>{s.link.label} →</Link>}
          </Section>
        ))}
        <Button style={button} href="https://laxhjalp.app/">Öppna Läxhjälp</Button>
        <HomeScreenSection />
        <Text style={footer}>Har du en fråga? Svara bara på det här mejlet – vi läser allt.</Text>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#ffffff', fontFamily: 'Nunito, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#293549', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const card = { backgroundColor: '#f4fbfa', borderRadius: '16px', padding: '16px 18px', margin: '0 0 12px' }
const homeBox = { border: '2px solid #20c4b6', borderRadius: '16px', padding: '16px 18px', margin: '28px 0 0' }
const cardTitle = { fontSize: '15px', fontWeight: 'bold' as const, color: '#293549', margin: '0 0 6px' }
const cardBody = { fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 6px' }
const link = { fontSize: '14px', color: '#159e93', fontWeight: 'bold' as const, display: 'inline-block', marginTop: '8px' }
const button = { backgroundColor: '#20c4b6', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block', margin: '20px 0 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
