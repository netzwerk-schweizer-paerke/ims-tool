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
    'http://localhost:3000',
}: RenderPasswordResetEmailParams): Promise<string> {
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/admin/reset/${token}`

  return await render(
    PasswordResetEmail({
      userEmail,
      resetUrl,
      locale,
    }),
  )
}
