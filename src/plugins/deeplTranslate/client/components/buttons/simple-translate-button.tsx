'use client'

import React from 'react'
import { Button, useConfig, useModal, useTranslation } from '@payloadcms/ui'
import { hasLocalization } from '@/lib/locale-utils'
import { StandaloneTranslatorModal } from '../modals/translator-modal'

const modalSlug = 'deepltranslate-modal'

export const SimpleTranslateButton: React.FC = () => {
  const modal = useModal()
  const { t } = useTranslation()
  const { config } = useConfig()

  if (!hasLocalization(config)) {
    return null
  }

  const openTranslator = () => {
    modal.openModal(modalSlug)
  }

  const closeTranslator = () => {
    modal.closeModal(modalSlug)
  }

  return (
    <>
      <Button onClick={openTranslator} buttonStyle="secondary" size="small">
        {t('plugin-deepltranslate:resolver_deepl_buttonLabel' as any)}
      </Button>
      <StandaloneTranslatorModal modalSlug={modalSlug} onClose={closeTranslator} />
    </>
  )
}
