'use client'

import { Button, useConfig, useModal, useTranslation } from '@payloadcms/ui'

import { hasLocalization } from '@/lib/locale-utils'

import type { DeepLTranslationKeys, DeepLTranslationsObject } from '../../../i18n-types'

import { StandaloneTranslatorModal } from '../modals/translator-modal'

const modalSlug = 'deepltranslate-modal'

export const SimpleTranslateButton = () => {
  const modal = useModal()
  const { t } = useTranslation<DeepLTranslationsObject, DeepLTranslationKeys>()
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
      {/* Medium to match the other document controls (health check, Save). */}
      <Button buttonStyle="secondary" onClick={openTranslator} size="medium">
        {t('plugin-deepltranslate:resolver_deepl_buttonLabel')}
      </Button>
      <StandaloneTranslatorModal modalSlug={modalSlug} onClose={closeTranslator} />
    </>
  )
}
