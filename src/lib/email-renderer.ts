import { render } from '@react-email/render'
import PasswordResetEmail from '../../emails/password-reset'

interface RenderPasswordResetEmailParams {
  userEmail: string
  token: string
  locale?: 'en' | 'de' | 'fr' | 'it'
  baseUrl?: string
}

export async function renderPasswordResetEmail({
  userEmail,
  token,
  locale = 'en',
  baseUrl = process.env.ORIGIN ||
    process.env.PAYLOAD_PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000',
}: RenderPasswordResetEmailParams): Promise<string> {
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`

  return await render(
    PasswordResetEmail({
      userEmail,
      resetUrl,
      locale,
    }),
  )
}
