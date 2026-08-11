import { Button, Select, useTranslation } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { Activity } from '@/payload-types'
import {
  FormCheckbox,
  FormLabel,
  FormSection,
  SelectAllCheckbox,
} from '@/payload/utilities/cloning/ui/form'

import { CloneInfoPanel } from './clone-info-panel'

interface CloneConfigurationFormProps {
  activities: Activity[]
  baseClass: string
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

export const CloneConfigurationForm: React.FC<CloneConfigurationFormProps> = ({
  activities,
  baseClass,
  isCloning,
  onCancel,
  onSubmit,
  targetOrganisations,
}) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const [formState, setFormState] = useState<Record<string, boolean>>({})
  const [selectedOption, setSelectedOption] = useState<
    undefined | { label: string; value: number }
  >()

  const availableOptions = useMemo(() => {
    const formFields = activities.map((activity) => {
      setFormState((prevState) => ({
        ...prevState,
        [`activity-${activity.id}`]: false,
      }))
      return { export: false, key: `activity-${activity.id}`, label: activity.name }
    })
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
  }

  const onCheckboxChange = (key: string) => {
    setFormState((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }))
  }

  const onOrganisationChange = (option: { label: string; value: number }) => {
    setSelectedOption(option)
  }

  const disableSave = useMemo(() => {
    const activitiesSelected = Object.values(formState).some(Boolean)
    const organisationSelected = !!selectedOption
    return !(activitiesSelected && organisationSelected && !isCloning)
  }, [formState, selectedOption, isCloning])

  const handleSubmit = () => {
    if (!selectedOption) return

    const selectedActivities = Object.entries(formState)
      .filter(([_, selected]) => selected)
      .map(([key]) => key.split('-', 2)[1])

    onSubmit(selectedActivities, selectedOption)
  }

  return (
    <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
      {/* Left Column - Configuration */}
      <div className="space-y-6">
        <div>
          <p className="mt-2 text-lg">{t('cloneActivity:form:instructions' as any)}</p>
        </div>

        <div>
          <FormLabel>{t('cloneActivity:form:activities' as any)}</FormLabel>
          <FormSection>
            <SelectAllCheckbox
              checked={selectAll}
              label={t('general:selectAll' as any)}
              onChange={handleSelectAll}
            />
            {availableOptions[0]?.fields?.map((field) => (
              <FormCheckbox
                checked={formState[field.key] || false}
                key={field.key}
                label={field.label}
                onChange={() => onCheckboxChange(field.key)}
              />
            ))}
          </FormSection>
          {Object.values(formState).some(Boolean) && (
            <p className="mt-1 text-[var(--theme-text-light)]">
              {Object.values(formState).filter(Boolean).length} activities selected
            </p>
          )}
        </div>

        <div>
          <FormLabel htmlFor="targetOrg">
            {t('cloneActivity:form:targetOrganisation' as any)}
          </FormLabel>
          <Select
            id="targetOrg"
            isClearable={false}
            isCreatable={false}
            onChange={onOrganisationChange as any}
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
                {t('cloneActivity:cloning' as any)}
              </span>
            ) : (
              t('cloneActivity:clone' as any)
            )}
          </Button>
          <Button
            buttonStyle="secondary"
            className={`${baseClass}__cancel`}
            disabled={isCloning}
            onClick={onCancel}>
            {t('general:cancel' as any)}
          </Button>
        </div>
      </div>

      {/* Right Column - Information */}
      <CloneInfoPanel />
    </div>
  )
}
