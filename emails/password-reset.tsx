import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

import { I18nCollection } from '@/lib/i18n-collection'

interface PasswordResetEmailProps {
  locale: 'de' | 'en' | 'fr' | 'it'
  resetUrl: string
  userEmail: string
}

export default function PasswordResetEmail({
  locale = 'en',
  resetUrl,
  userEmail,
}: PasswordResetEmailProps) {
  const t = I18nCollection.email.passwordReset

  return (
    <Html>
      <Head />
      <Preview>{t.instructions[locale]}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={heading}>IMS Tool</Heading>
          </Section>

          <Section style={contentSection}>
            <Heading style={title}>{t.subject[locale]}</Heading>

            <Text style={greeting}>
              {t.greeting[locale]}, {userEmail}
            </Text>

            <Text style={paragraph}>{t.instructions[locale]}</Text>

            <Section style={buttonSection}>
              <Button href={resetUrl} style={button}>
                {t.buttonText[locale]}
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={alternativeText}>{t.alternativeText[locale]}</Text>

            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>

            <Hr style={hr} />

            <Text style={disclaimer}>{t.noRequestMessage[locale]}</Text>

            <Text dangerouslySetInnerHTML={{ __html: t.footer[locale] }} style={footer} />
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles using professional email-safe CSS
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  padding: '20px 0 48px',
}

const logoSection = {
  backgroundColor: '#f8f9fa',
  padding: '20px 40px',
  textAlign: 'center' as const,
}

const heading = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const contentSection = {
  padding: '40px',
}

const title = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  textAlign: 'center' as const,
}

const greeting = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0 0 20px',
}

const paragraph = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 30px',
}

const buttonSection = {
  margin: '30px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#007bff',
  border: 'none',
  borderRadius: '6px',
  color: '#ffffff',
  cursor: 'pointer',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '30px 0',
}

const alternativeText = {
  color: '#6a6a6a',
  fontSize: '14px',
  margin: '20px 0 10px',
}

const link = {
  color: '#007bff',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
}

const disclaimer = {
  color: '#8a8a8a',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '20px 0',
}

const footer = {
  color: '#6a6a6a',
  fontSize: '14px',
  margin: '30px 0 0',
  textAlign: 'center' as const,
}
