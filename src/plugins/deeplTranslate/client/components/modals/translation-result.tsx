import { Button, useTranslation } from '@payloadcms/ui'

import type { DeepLTranslationKeys, DeepLTranslationsObject } from '../../../i18n-types'

interface TranslationResultProps {
  error?: string
  errorType?: 'authentication' | 'generic' | 'network' | 'quota_exceeded'
  onClose: () => void
  onTryAgain: () => void
  onViewTranslation: () => void
  selectedFromLabel?: string
  selectedToLabel?: string
  success: boolean
}

export const TranslationResult = ({
  error,
  errorType,
  onClose,
  onTryAgain,
  onViewTranslation,
  selectedFromLabel,
  selectedToLabel,
  success,
}: TranslationResultProps) => {
  const { t } = useTranslation<DeepLTranslationsObject, DeepLTranslationKeys>()

  if (success) {
    return (
      <div>
        <div className="mb-4 rounded border border-[var(--theme-success-200)] bg-[var(--theme-success-50)] p-4 text-[var(--theme-success-600)]">
          ✓ {t('plugin-deepltranslate:resolver_deepl_successMessage')}
        </div>
        {selectedFromLabel && selectedToLabel && (
          <div className="mb-4">
            <div>
              {t('plugin-deepltranslate:resolver_deepl_translateFrom')}:{' '}
              <strong>{selectedFromLabel}</strong>
            </div>
            <div>
              {t('plugin-deepltranslate:resolver_deepl_translateTo')}:{' '}
              <strong>{selectedToLabel}</strong>
            </div>
          </div>
        )}
        <div className="deepltranslate__buttons flex gap-4">
          <Button buttonStyle="primary" onClick={onViewTranslation}>
            {t('plugin-deepltranslate:resolver_deepl_viewTranslation').replace(
              '{{language}}',
              selectedToLabel || '',
            )}
          </Button>
          <Button buttonStyle="secondary" onClick={onClose}>
            {t('plugin-deepltranslate:resolver_deepl_close')}
          </Button>
        </div>
      </div>
    )
  }

  // Helper function to get the appropriate error message
  const getErrorMessage = () => {
    switch (errorType) {
      case 'authentication': {
        return 'DeepL authentication failed. Please check your API key.'
      }
      case 'network': {
        return 'Network error connecting to DeepL API. Please try again.'
      }
      case 'quota_exceeded': {
        return 'Translation quota exceeded. Please check your DeepL account limits.'
      }
      default: {
        return error || t('plugin-deepltranslate:resolver_deepl_errorMessage')
      }
    }
  }

  return (
    <div>
      <div className="mb-4 rounded border border-[var(--theme-error-200)] bg-[var(--theme-error-50)] p-4 text-[var(--theme-error-600)]">
        ✕ {getErrorMessage()}
      </div>
      <div className="deepltranslate__buttons">
        <Button buttonStyle="secondary" onClick={onTryAgain}>
          {t('plugin-deepltranslate:resolver_deepl_tryAgain')}
        </Button>
      </div>
    </div>
  )
}
