import './styles.scss'

import { CloseMenuIcon, Modal } from '@payloadcms/ui'
import { Content } from '@/plugins/deeplTranslate/client/components/TranslatorModal/Content'
import { useTranslator } from '@/plugins/deeplTranslate/client/providers/Translator/context'
import React from 'react'

export const TranslatorModal: React.FC = () => {
  const { closeTranslator, modalSlug } = useTranslator()

  return (
    <Modal className="deepltranslate__modal" slug={modalSlug}>
      <div className="deepltranslate__wrapper">
        <button 
          type="button"
          aria-label="Close" 
          className="deepltranslate__close" 
          onClick={closeTranslator}
        >
          <CloseMenuIcon />
        </button>
        <Content />
      </div>
    </Modal>
  )
}
