import { Button, Select, useTranslation } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { HealthReport } from '@/payload/components/health/health-report'
import {
  FormCheckbox,
  FormLabel,
  FormSection,
  SelectAllCheckbox,
} from '@/payload/utilities/cloning/ui/form'
import { CloneableCollectionSlug, useClonePreflight } from '@/payload/utilities/cloning/ui/hooks'

import { CloneInfoPanel } from './clone-info-panel'

/**
 * The form reads the id and the name only, so an activity, a task flow and a task list all fit.
 * The three clone overlays share this one form.
 */
type CloneableEntity = {
  id: number
  name: string
}

interface CloneConfigurationFormProps {
  activities: CloneableEntity[]
  baseClass: string
  /** The collection the rows belong to. The pre-flight check needs it to address each row. */
  collectionSlug: CloneableCollectionSlug
  isCloning: boolean
  onCancel: () => void
  onSubmit: (
    selectedActivities: string[],
    targetOrganisation: { label: string; value: number },
  ) => void
  targetOrganisations: { label: string; value: number }[]
}

type FormField = {
  export: boolean
  key: string
  label: string
}

type FormSection = {
  fields: FormField[]
  section: string
}

/** The shape Payload's `Select` hands to `onChange`. */
type SelectOption = {
  [key: string]: unknown
  id?: string
  value: unknown
}

export const CloneConfigurationForm = ({
  activities,
  baseClass,
  collectionSlug,
  isCloning,
  onCancel,
  onSubmit,
  targetOrganisations,
}: CloneConfigurationFormProps) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const [formState, setFormState] = useState<Record<string, boolean>>({})
  const [selectedOption, setSelectedOption] = useState<
    undefined | { label: string; value: number }
  >()
  const preflight = useClonePreflight()

  // An absent key already reads as false below, so the rows need no seeding pass.
  const availableOptions = useMemo(() => {
    const formFields = activities.map((activity) => ({
      export: false,
      key: `activity-${activity.id}`,
      label: activity.name,
    }))
    return [
      {
        fields: formFields,
        section: 'Activities',
      },
    ] as FormSection[]
  }, [activities])

  const selectAll = useMemo(() => {
    return availableOptions[0]?.fields?.every((field) => formState[field.key]) || false
  }, [availableOptions, formState])

  const handleSelectAll = () => {
    const newState = { ...formState }
    const shouldSelectAll = !selectAll
    for (const field of availableOptions[0]?.fields ?? []) {
      newState[field.key] = shouldSelectAll
    }
    setFormState(newState)
    preflight.clear()
  }

  const onCheckboxChange = (key: string) => {
    setFormState((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }))
    // The report describes one selection. A changed selection makes it stale.
    preflight.clear()
  }

  const onOrganisationChange = (option: SelectOption | SelectOption[]) => {
    if (Array.isArray(option) || typeof option?.label !== 'string') {
      return
    }

    setSelectedOption({ label: option.label, value: Number(option.value) })
  }

  const disableSave = useMemo(() => {
    const activitiesSelected = Object.values(formState).some(Boolean)
    const organisationSelected = !!selectedOption
    return !(activitiesSelected && organisationSelected && !isCloning && !preflight.checking)
  }, [formState, selectedOption, isCloning, preflight.checking])

  const handleSubmit = async () => {
    if (!selectedOption) return

    const selectedActivities = Object.entries(formState)
      .filter(([_, selected]) => selected)
      .map(([key]) => key.split('-', 2)[1])
      .filter((id): id is string => Boolean(id))

    // A blocking finding names a condition that makes the endpoint throw. The endpoint rolls
    // the whole batch back on the first throw, so one bad row cancels every other selection.
    const outcome = await preflight.run(collectionSlug, selectedActivities.map(Number))

    if (outcome.status === 'superseded') {
      return
    }

    if (outcome.status === 'checked' && outcome.report.summary.blocking > 0) {
      return
    }

    onSubmit(selectedActivities, selectedOption)
  }

  return (
    <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
      {/* Left Column - Configuration */}
      <div className="space-y-6">
        <div>
          <p className="mt-2 text-lg">{t('cloneActivity:form:instructions')}</p>
        </div>

        {preflight.report && (
          <div className="space-y-4">
            <HealthReport report={preflight.report} />
          </div>
        )}

        {preflight.failed && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {t('dataHealth:preconditionFailed')}
          </p>
        )}

        <div>
          <FormLabel>{t('cloneActivity:form:activities')}</FormLabel>
          <FormSection>
            <SelectAllCheckbox
              checked={selectAll}
              label={t('general:selectAll')}
              onChange={handleSelectAll}
            />
            {availableOptions[0]?.fields?.map((field) => (
              <FormCheckbox
                checked={formState[field.key] || false}
                disabled={preflight.checking || isCloning}
                key={field.key}
                label={field.label}
                onChange={() => onCheckboxChange(field.key)}
              />
            ))}
          </FormSection>
          {Object.values(formState).some(Boolean) && (
            <p className="mt-1 text-[var(--theme-text-light)]">
              {t('cloneActivity:form:selectedCount', {
                count: Object.values(formState).filter(Boolean).length,
              })}
            </p>
          )}
        </div>

        <div>
          <FormLabel htmlFor="targetOrg">
            {t('cloneActivity:form:targetOrganisation')}
          </FormLabel>
          <Select
            id="targetOrg"
            isClearable={false}
            isCreatable={false}
            onChange={onOrganisationChange}
            options={targetOrganisations}
            value={selectedOption}
          />
        </div>

        <div className="flex gap-2">
          <Button
            buttonStyle="primary"
            className={`${baseClass}__save`}
            disabled={disableSave}
            onClick={handleSubmit}>
            {isCloning ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-elevation-0)] border-t-transparent" />
                {t('cloneActivity:cloning')}
              </span>
            ) : (
              t('cloneActivity:clone')
            )}
          </Button>
          <Button
            buttonStyle="secondary"
            className={`${baseClass}__cancel`}
            disabled={isCloning}
            onClick={onCancel}>
            {t('general:cancel')}
          </Button>
        </div>
      </div>

      {/* Right Column - Information */}
      <CloneInfoPanel />
    </div>
  )
}
