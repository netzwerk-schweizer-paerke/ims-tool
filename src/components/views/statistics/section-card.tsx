import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  note?: ReactNode
  title: ReactNode
}

export const SectionCard = ({ children, note, title }: Props) => (
  <section
    className={
      'flex flex-col gap-4 rounded-md border p-4 [background-color:var(--theme-elevation-0)] [border-color:var(--theme-border-color)]'
    }>
    <h2 className={'m-0 text-base font-semibold [color:var(--theme-text)]'}>{title}</h2>
    {children}
    {note ? <p className={'m-0 text-xs [color:var(--theme-elevation-500)]'}>{note}</p> : null}
  </section>
)
