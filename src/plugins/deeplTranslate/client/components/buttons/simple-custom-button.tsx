import React from 'react'
import { PublishButton, SaveButton } from '@payloadcms/ui'
import { SimpleTranslateButton } from './simple-translate-button'
import { TranslationIndicator } from '../indicators/translation-indicator'

interface Props {
  CustomComponent?: typeof PublishButton | typeof SaveButton
  type: 'publish' | 'save'
}

export const SimpleCustomButton: React.FC<Props> = ({ CustomComponent, type }) => {
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
