import React, { useMemo, useState } from 'react'
import { Button, Select, useTranslation } from '@payloadcms/ui'
import { I18nKeys, I18nObject } from '@/lib/useTranslation-custom-types'
import { Activity } from '@/payload-types'
import { CloneInfoPanel } from './CloneInfoPanel'
import {
  FormCheckbox,
  FormLabel,
  FormSection,
  SelectAllCheckbox,
} from '@/payload/utilities/cloning/ui/form'

type FormField = {
  key: string
  label: string
  export: boolean
}

type FormSection = {
  section: string
  fields: FormField[]
}

interface CloneConfigurationFormProps {
  activities: Activity[]
  targetOrganisations: { label: string; value: number }[]
  onSubmit: (
    selectedActivities: string[],
    targetOrganisation: { label: string; value: number },
  ) => void
  isCloning: boolean
  baseClass: string
  onCancel: () => void
}

export const CloneConfigurationForm: React.FC<CloneConfigurationFormProps> = ({
  activities,
  targetOrganisations,
  onSubmit,
  isCloning,
  baseClass,
  onCancel,
}) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const [formState, setFormState] = useState<Record<string, boolean>>({})
  const [selectedOption, setSelectedOption] = useState<
    { label: string; value: number } | undefined
  >()

  const availableOptions = useMemo(() => {
    const formFields = activities.map((activity) => {
      setFormState((prevState) => ({
        ...prevState,
        [`activity-${activity.id}`]: false,
      }))
      return { key: `activity-${activity.id}`, label: activity.name, export: false }
    })
    return [
      {
        section: 'Activities',
        fields: formFields,
      },
    ] as FormSection[]
  }, [activities])

  const selectAll = useMemo(() => {
    return availableOptions[0]?.fields?.every((field) => formState[field.key]) || false
  }, [availableOptions, formState])

  const handleSelectAll = () => {
    const newState = { ...formState }
    const shouldSelectAll = !selectAll
    availableOptions[0]?.fields?.forEach((field) => {
      newState[field.key] = shouldSelectAll
    })
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
    const activitiesSelected = Object.values(formState).some((value) => value)
    const organisationSelected = !!selectedOption
    return !(activitiesSelected && organisationSelected && !isCloning)
  }, [formState, selectedOption, isCloning])

  const handleSubmit = () => {
    if (!selectedOption) return

    const selectedActivities = Object.entries(formState)
      .filter(([_, selected]) => selected)
      .map(([key]) => key.split('-')[1])

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
              onChange={handleSelectAll}
              label={t('general:selectAll' as any)}
            />
            {availableOptions[0]?.fields?.map((field) => (
              <FormCheckbox
                key={field.key}
                checked={formState[field.key] || false}
                onChange={() => onCheckboxChange(field.key)}
                label={field.label}
              />
            ))}
          </FormSection>
          {Object.values(formState).filter(Boolean).length > 0 && (
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
            options={targetOrganisations}
            value={selectedOption}
            onChange={onOrganisationChange as any}
            isCreatable={false}
            isClearable={false}
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
            onClick={onCancel}
            disabled={isCloning}>
            {t('general:cancel' as any)}
          </Button>
        </div>
      </div>

      {/* Right Column - Information */}
      <CloneInfoPanel />
    </div>
  )
}
