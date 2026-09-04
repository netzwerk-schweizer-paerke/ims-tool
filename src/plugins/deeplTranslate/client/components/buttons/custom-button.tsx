import type { CustomPublishButton } from 'payload'

export const CustomButton = (type: 'publish' | 'save'): CustomPublishButton => {
  return {
    clientProps: {
      type,
    },
    path: '@/plugins/deeplTranslate/client/components/buttons/simple-custom-button#SimpleCustomButton',
  }
}
