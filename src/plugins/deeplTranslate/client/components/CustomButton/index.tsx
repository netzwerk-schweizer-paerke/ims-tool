import type { CustomPublishButton } from 'payload'

export const CustomButton = (type: 'publish' | 'save'): CustomPublishButton => {
  return {
    clientProps: {
      type,
    },
    path: 'src/plugins/deeplTranslate/client/components/CustomButton/CustomButtonWithTranslator#CustomButtonWithTranslator',
  }
}
