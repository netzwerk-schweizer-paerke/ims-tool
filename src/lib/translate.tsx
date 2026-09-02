'use client'
import { useTranslation } from '@payloadcms/ui'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

type Props = {
  k: I18nKeys
  vars?: Record<string, unknown>
}

export const Translate = ({ k, vars }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  return <>{t(k, vars)}</>
}
