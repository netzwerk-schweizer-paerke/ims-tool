import React, { useMemo, useState } from 'react'
import { Button, Select, useTranslation } from '@payloadcms/ui'
import { I18nObject, I18nKeys } from '@/lib/useTranslation-custom-types'
import { Activity } from '@/payload-types'
import { CloneInfoPanel } from './CloneInfoPanel'

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
          {availableOptions?.map((section) => (
            <div key={section.section} className={'mb-12 max-w-fit'}>
              <h2 className={'text-xl font-bold'}>{t('cloneActivity:form:activities' as any)}</h2>
              <ul>
                {section.fields?.map((field) => (
                  <li key={field.key} className={'flex select-none gap-2 p-2'}>
                    <input
                      type="checkbox"
                      id={field.key}
                      name={field.key}
                      checked={formState[field.key] || false}
                      onChange={() => onCheckboxChange(field.key)}
                    />
                    <label
                      htmlFor={field.key}
                      className={'hover:cursor-pointer'}
                      dangerouslySetInnerHTML={{ __html: field.label }}></label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h2 className={'text-xl font-bold'}>
            {t('cloneActivity:form:targetOrganisation' as any)}
          </h2>
          <Select
            options={targetOrganisations}
            value={selectedOption}
            onChange={onOrganisationChange as any}
            isCreatable={false}
            isClearable={false}
          />
        </div>

        <div className={'flex flex-row gap-4'}>
          <Button
            buttonStyle="primary"
            className={`${baseClass}__save`}
            disabled={disableSave}
            onClick={handleSubmit}>
            {t('general:save')}
          </Button>
          <Button buttonStyle="secondary" className={`${baseClass}__cancel`} onClick={onCancel}>
            {t('general:cancel')}
          </Button>
        </div>
      </div>

      {/* Right Column - Information */}
      <CloneInfoPanel />
    </div>
  )
}
