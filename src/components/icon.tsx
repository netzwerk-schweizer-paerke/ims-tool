'use client'
import { useTranslation } from '@payloadcms/ui'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

import { NspSmall } from './nsp-small'

export const Icon = () => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  return (
    <div>
      {/* role/aria-label preserve the accessible name the previous <Image alt> provided. */}
      <NspSmall aria-label={t('general:logoAlt')} height={32} role="img" width={32} />
    </div>
  )
}
