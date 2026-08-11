import { render } from '@react-email/render'

import PasswordResetEmail from '../../emails/password-reset'

interface RenderPasswordResetEmailParams {
  baseUrl?: string
  locale?: 'de' | 'en' | 'fr' | 'it'
  token: string
  userEmail: string
}

export async function renderPasswordResetEmail({
  baseUrl = process.env.ORIGIN || 'http://localhost:3000',
  locale = 'en',
  token,
  userEmail,
}: RenderPasswordResetEmailParams): Promise<string> {
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/admin/reset/${token}`

  return await render(
    PasswordResetEmail({
      locale,
      resetUrl,
      userEmail,
    }),
  )
}
