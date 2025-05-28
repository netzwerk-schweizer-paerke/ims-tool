// @ts-ignore
import logoSrc from './nsp-small.svg?url'
import Image from 'next/image'

export const Icon = () => {
  return (
    <div>
      <Image src={logoSrc} width={32} height={32} alt="NSP logo" />
    </div>
  )
}
