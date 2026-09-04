import Link from 'next/link'
import React, { ReactNode } from 'react'

import { Translate } from '@/lib/translate'

type Props = {
  /** The way back to the entry page. A visitor on the entry page itself gets none. */
  backHref?: string
  children: ReactNode
  organisationName?: null | string
}

/**
 * The frame of a public share page. It carries no navigation, no edit link and no login state,
 * because the visitor holds a link rather than a session.
 */
export const ShareShell = ({ backHref, children, organisationName }: Props) => (
  <div
    style={{
      marginTop: 'calc(var(--base) * 2)',
      paddingBottom: 'calc(var(--base) * 4)',
      paddingLeft: 'var(--gutter-h)',
      paddingRight: 'var(--gutter-h)',
    }}>
    <header className={'mb-6 flex flex-row items-baseline justify-between gap-4'}>
      <span>{organisationName}</span>
      <span className={'text-sm opacity-70'}>
        <Translate k={'shareLink:publicNotice'} />
      </span>
    </header>
    {backHref && (
      <div className={'mb-4'}>
        <Link className={'link-hover link'} href={backHref}>
          <Translate k={'common:back'} />
        </Link>
      </div>
    )}
    {children}
  </div>
)
