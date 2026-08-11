'use client'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

interface CloneLoadingOverlayProps {
  isVisible: boolean
  subtitle?: string
  title?: string
}

export const CloneLoadingOverlay: React.FC<CloneLoadingOverlayProps> = ({
  isVisible,
  subtitle,
  title,
}) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()

  if (!isVisible) return null

  return (
    <div className="bg-[var(--theme-elevation-1000)]/50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="rounded-lg border border-[var(--theme-border-color)] bg-[var(--theme-bg)] p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--theme-border-color)] border-t-[var(--theme-elevation-400)]" />
          <p className="text-lg font-medium text-[var(--theme-text)]">
            {title || t('cloneActivity:processing' as any)}
          </p>
          <p className="text-[var(--theme-text)]/70 text-sm">
            {subtitle || t('cloning:loadingMessage' as any)}
          </p>
        </div>
      </div>
    </div>
  )
}
