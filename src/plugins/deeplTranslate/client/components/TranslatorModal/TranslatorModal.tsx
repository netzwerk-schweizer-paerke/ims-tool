import './styles.scss'

import { Modal } from '@payloadcms/ui'
import { Content } from '@/plugins/deeplTranslate/client/components/TranslatorModal/Content'
import { useTranslator } from '@/plugins/deeplTranslate/client/providers/Translator/context'

export const TranslatorModal = () => {
  const { closeTranslator, modalSlug } = useTranslator()

  return (
    <Modal className={'deepltranslate__modal'} slug={modalSlug}>
      <div className={'deepltranslate__wrapper'}>
        <button aria-label="Close" className={'deepltranslate__close'} onClick={closeTranslator} />
        <Content />
      </div>
    </Modal>
  )
}
