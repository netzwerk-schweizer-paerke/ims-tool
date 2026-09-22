'use client'
import { useTranslation } from '@payloadcms/ui'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

import { NspSmall } from './nsp-small'

export const Icon = () => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <div>
      {/* role/aria-label preserve the accessible name the previous <Image alt> provided. */}
      {/* Payload sizes a.step-nav__home to 18px. A larger mark is clipped, never scaled down. */}
      <NspSmall aria-label={t('general:logoAlt')} height={18} role="img" width={18} />
    </div>
  )
}
