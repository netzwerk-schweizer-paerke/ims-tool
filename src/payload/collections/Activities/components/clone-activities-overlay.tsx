'use client'
import {
  Button,
  Drawer,
  Select,
  useDocumentInfo,
  useLocale,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { CloseIcon } from 'next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon'
import React, { useMemo } from 'react'
import { I18nCollection } from '@/lib/i18nCollection'
import {
  baseClass,
  drawerSlug,
} from '@/payload/collections/Activities/components/clone-activity-button'
import { Activity } from '@/payload-types'
import ky from 'ky'

const getLocalizedFieldLabel = (
  key: keyof typeof I18nCollection.fieldLabel,
  localeCode: string,
): string => {
  const fieldLabel = I18nCollection.fieldLabel[key]
  return fieldLabel ? (fieldLabel as Record<string, string>)[localeCode] : 'Unknown'
}

type FormField = {
  key: string
  label: string
  export: boolean
}

type FormSection = {
  section: string
  fields: FormField[]
}

// const fetchCv = async (id: any, serverURL: string) => {
//   if (!id) {
//     return;
//   }
//   const response = await ky.get<Cv>(`${serverURL}/api/cv/${id}`);
//   return await response.json();
// };

type Props = {
  activities: Activity[]
  targetOrganisations: { label: string; value: number }[]
}

export const CloneActivitiesOverlay: React.FC<Props> = ({ activities, targetOrganisations }) => {
  const { id } = useDocumentInfo()
  const locale = useLocale()
  const { closeModal, isModalOpen } = useModal()
  const { t } = useTranslation()
  const isOpen = isModalOpen(drawerSlug)
  const [formState, setFormState] = React.useState<Record<string, boolean>>({})
  const [selectedOption, setSelectedOption] = React.useState<
    { label: string; value: number } | undefined
  >()
  const [cloning, setCloning] = React.useState(false)

  const availableOptions = useMemo(() => {
    if (!isOpen) return []
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
  }, [activities, isOpen])

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
    const activities = Object.values(formState).some((value) => value)
    const organisations = !!selectedOption
    return !(activities && organisations && !cloning)
  }, [formState, selectedOption, cloning])

  const onSaveClick = async () => {
    setCloning(true)
    for (const key in formState) {
      if (formState[key]) {
        const activityId = key.split('-')[1]
        const cloneEndpoint = `/api/activities/${activityId}/organisation/${selectedOption?.value}`
        await ky.post(cloneEndpoint)
      }
    }
    setCloning(false)
  }

  const onCloseClick = () => {
    setCloning(false)
    setFormState({})
    setSelectedOption(undefined)
    closeModal(drawerSlug)
  }

  return (
    <Drawer slug={drawerSlug} Header={null}>
      <div className={'mt-12 grid grid-cols-[auto_min-content]'}>
        <div className={'flex flex-col gap-8'}>
          <h1 className={'text-2xl font-bold'}>Cloning an activity</h1>
          <p>
            <strong>Important:</strong> This action will clone the selected activities to the target
            organisation. It will neither overwrite nor delete any existing activities.
          </p>
          <p>Select the activities you wish to clone and the target organisation below.</p>
          <div>
            {availableOptions?.map((section) => (
              <div key={section.section} className={'mb-12'}>
                <h2 className={'text-xl font-bold'}>{section.section}</h2>
                <ul>
                  {section.fields?.map((field) => (
                    <li
                      key={field.key}
                      className={
                        'flex select-none gap-2 p-2 hover:cursor-pointer hover:bg-emerald-200/15'
                      }
                      onClick={() => onCheckboxChange(field.key)}>
                      <input
                        type="checkbox"
                        id={field.key}
                        name={field.key}
                        checked={formState[field.key]}
                        onChange={() => onCheckboxChange(field.key)}
                      />
                      <label
                        htmlFor={field.key}
                        className={''}
                        dangerouslySetInnerHTML={{ __html: field.label }}></label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div>
            <h2 className={'text-xl font-bold'}>Select target organisation</h2>
            <Select
              options={targetOrganisations}
              value={selectedOption}
              onChange={onOrganisationChange as any}
              isCreatable={false}
              isClearable={false}
            />
          </div>
          {cloning && (
            <div>
              <p>Cloning activities... Please wait!</p>
            </div>
          )}
          <div className={'flex flex-row gap-4'}>
            <Button
              buttonStyle="primary"
              className={`${baseClass}__save`}
              disabled={disableSave}
              onClick={onSaveClick}>
              {t('general:save')}
            </Button>
            <Button
              buttonStyle="secondary"
              className={`${baseClass}__cancel`}
              onClick={onCloseClick}>
              {t('general:cancel')}
            </Button>
          </div>
        </div>
        <div>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__cancel`}
            onClick={onCloseClick}>
            <CloseIcon />
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
