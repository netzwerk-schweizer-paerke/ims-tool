'use client'

import { DateTime } from '@/components/date-time'
import { Translate } from '@/lib/translate'

type Props = {
  date?: string
}

export const LastUpdated = ({ date }: Props) => {
  return (
    <div className={'flex flex-row gap-4'}>
      <div>
        <Translate k={'common:lastUpdated'} />:
      </div>
      <div>
        <DateTime date={date} />
      </div>
    </div>
  )
}
