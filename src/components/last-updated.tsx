'use client'

import { useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'

import { Translate } from '@/lib/translate'

type Props = {
  date?: string
}

export const LastUpdated = ({ date }: Props) => {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const dateFormat = config.admin.dateFormat

  return (
    <div className={'flex flex-row gap-4'}>
      <div>
        <Translate k={'common:lastUpdated'} />:
      </div>
      <div>{date ? formatDate({ date, i18n, pattern: dateFormat }) : ''}</div>
    </div>
  )
}
