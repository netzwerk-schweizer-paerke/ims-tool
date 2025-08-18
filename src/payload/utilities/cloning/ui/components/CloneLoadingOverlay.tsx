'use client'
import React from 'react'
import { useTranslation } from '@payloadcms/ui'
import { I18nKeys, I18nObject } from '@/lib/useTranslation-custom-types'

interface CloneLoadingOverlayProps {
  isVisible: boolean
  title?: string
  subtitle?: string
}

export const CloneLoadingOverlay: React.FC<CloneLoadingOverlayProps> = ({
  isVisible,
  title,
  subtitle,
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
