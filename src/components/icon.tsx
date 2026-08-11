import { NspSmall } from './nsp-small'

export const Icon = () => {
  return (
    <div>
      {/* role/aria-label preserve the accessible name the previous <Image alt> provided. */}
      <NspSmall aria-label="NSP logo" height={32} role="img" width={32} />
    </div>
  )
}
