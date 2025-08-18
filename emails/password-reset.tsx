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
  userEmail: string
  resetUrl: string
  locale: 'en' | 'de' | 'fr' | 'it'
}

export default function PasswordResetEmail({
  userEmail,
  resetUrl,
  locale = 'en',
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
              <Button style={button} href={resetUrl}>
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

            <Text style={footer} dangerouslySetInnerHTML={{ __html: t.footer[locale] }} />
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
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const logoSection = {
  padding: '20px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
}

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
}

const contentSection = {
  padding: '40px',
}

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 30px',
  textAlign: 'center' as const,
}

const greeting = {
  fontSize: '16px',
  color: '#1a1a1a',
  margin: '0 0 20px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a4a4a',
  margin: '0 0 30px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
  cursor: 'pointer',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '30px 0',
}

const alternativeText = {
  fontSize: '14px',
  color: '#6a6a6a',
  margin: '20px 0 10px',
}

const link = {
  color: '#007bff',
  textDecoration: 'underline',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

const disclaimer = {
  fontSize: '14px',
  color: '#8a8a8a',
  margin: '20px 0',
  fontStyle: 'italic',
}

const footer = {
  fontSize: '14px',
  color: '#6a6a6a',
  margin: '30px 0 0',
  textAlign: 'center' as const,
}
