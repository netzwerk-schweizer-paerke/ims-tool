import React from 'react'
import { Button, useTranslation } from '@payloadcms/ui'

interface TranslationResultProps {
  success: boolean
  error?: string
  selectedFromLabel?: string
  selectedToLabel?: string
  onViewTranslation: () => void
  onClose: () => void
  onTryAgain: () => void
}

export const TranslationResult: React.FC<TranslationResultProps> = ({
  success,
  error,
  selectedFromLabel,
  selectedToLabel,
  onViewTranslation,
  onClose,
  onTryAgain,
}) => {
  const { t } = useTranslation()

  if (success) {
    return (
      <div>
        <div className="mb-4 rounded border border-[var(--theme-success-200)] bg-[var(--theme-success-50)] p-4 text-[var(--theme-success-600)]">
          ✓ {t('plugin-deepltranslate:resolver_deepl_successMessage' as any)}
        </div>
        {selectedFromLabel && selectedToLabel && (
          <div className="mb-4 text-sm">
            <div>
              {t('plugin-deepltranslate:resolver_deepl_translateFrom' as any)}:{' '}
              <strong>{selectedFromLabel}</strong>
            </div>
            <div>
              {t('plugin-deepltranslate:resolver_deepl_translateTo' as any)}:{' '}
              <strong>{selectedToLabel}</strong>
            </div>
          </div>
        )}
        <div className="deepltranslate__buttons flex gap-4">
          <Button onClick={onViewTranslation} buttonStyle="primary">
            {t('plugin-deepltranslate:resolver_deepl_viewTranslation' as any).replace(
              '{{language}}',
              selectedToLabel || '',
            )}
          </Button>
          <Button onClick={onClose} buttonStyle="secondary">
            {t('plugin-deepltranslate:resolver_deepl_close' as any)}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 rounded border border-[var(--theme-error-200)] bg-[var(--theme-error-50)] p-4 text-[var(--theme-error-600)]">
        ✕ {error}
      </div>
      <div className="deepltranslate__buttons">
        <Button onClick={onTryAgain} buttonStyle="secondary">
          {t('plugin-deepltranslate:resolver_deepl_tryAgain' as any)}
        </Button>
      </div>
    </div>
  )
}
