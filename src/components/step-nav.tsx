'use client'
import { StepNavItem, useStepNav, useTranslation } from '@payloadcms/ui'
import { useEffect } from 'react'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

type Fields = {
  id: number | string
  title: null | string | undefined
}

type Props = {
  activity?: Fields & { blockId: string }
  activityBlock?: Fields
  flowBlock?: Fields
  home?: boolean
  listBlock?: Fields
}

export const StepNav: React.FC<Props> = ({
  activity,
  activityBlock,
  flowBlock,
  home = false,
  listBlock,
}) => {
  const step = useStepNav()
  const { t } = useTranslation<I18nObject, I18nKeys>()

  useEffect(() => {
    const steps: StepNavItem[] = [
      { label: t('activityLandscape:title'), url: '/admin/activities' },
      { label: '', url: '' },
      { label: '', url: '' },
    ]

    if (activity) {
      steps[1] = {
        label: activity.title || t('activityBlock:title'),
        url: `/admin/activity/${activity.id}/block/${activity.blockId}`,
      }
    }

    if (activityBlock) {
      steps[2] = {
        label: activityBlock.title || t('activityBlock:title'),
        url: `/admin/activity/${activity?.id}/block/${activityBlock.id}`,
      }
    }

    if (flowBlock) {
      steps[3] = {
        label: flowBlock.title || t('activityBlock:flows:title'),
        url: `/admin/flow/${flowBlock.id}`,
      }
    }

    if (listBlock) {
      steps[3] = {
        label: listBlock.title || t('activityBlock:tasks:title'),
        url: `/admin/list/${listBlock.id}`,
      }
    }

    if (home) {
      steps[1] = { label: '', url: '' }
      steps[2] = { label: '', url: '' }
      steps[3] = { label: '', url: '' }
    }

    step.setStepNav(steps.filter((step) => step.label))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
