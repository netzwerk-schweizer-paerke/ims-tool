import { PublishButton, SaveButton } from '@payloadcms/ui'

import { TranslationIndicator } from '../indicators/translation-indicator'
import { SimpleTranslateButton } from './simple-translate-button'

interface Props {
  CustomComponent?: typeof PublishButton | typeof SaveButton
  type: 'publish' | 'save'
}

export const SimpleCustomButton = ({ CustomComponent, type }: Props) => {
  const DefaultButton = type === 'publish' ? PublishButton : SaveButton
  const ButtonComponent = CustomComponent || DefaultButton

  return (
    <>
      <TranslationIndicator />
      <SimpleTranslateButton />
      <ButtonComponent />
    </>
  )
}
