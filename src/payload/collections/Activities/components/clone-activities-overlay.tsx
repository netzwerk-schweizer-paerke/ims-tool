'use client'
import {
  Button,
  CloseMenuIcon,
  Drawer,
  Select,
  useLocale,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { useMemo, useState } from 'react'
import { I18nCollection } from '@/lib/i18n-collection'
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

type Props = {
  activities: Activity[]
  targetOrganisations: { label: string; value: number }[]
}

export const CloneActivitiesOverlay: React.FC<Props> = ({ activities, targetOrganisations }) => {
  const { closeModal, isModalOpen } = useModal()
  const locale = useLocale()
  const { t } = useTranslation()
  const isOpen = isModalOpen(drawerSlug)
  const [formState, setFormState] = useState<Record<string, boolean>>({})
  const [selectedOption, setSelectedOption] = useState<
    { label: string; value: number } | undefined
  >()
  const [cloning, setCloning] = useState(false)
  const [status, setStatus] = useState<'error' | 'success' | 'partial' | ''>('')

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
    let errorCount = 0
    let successCount = 0

    // Get all activities to clone
    const activitiesToClone = Object.entries(formState)
      .filter(([_, selected]) => selected)
      .map(([key]) => key.split('-')[1])

    // Process each activity
    await Promise.all(
      activitiesToClone.map(async (activityId) => {
        try {
          const cloneEndpoint = `/api/activities/${activityId}/organisation/${selectedOption?.value}${
            locale?.code ? `?locale=${locale.code}` : ''
          }`
          await ky.post(cloneEndpoint)
          successCount++
        } catch (error) {
          console.error(`Failed to clone activity ${activityId}`, error)
          errorCount++
        }
      }),
    )

    // Set status based on results
    if (errorCount === 0) {
      setStatus('success')
    } else if (successCount === 0) {
      setStatus('error')
    } else {
      setStatus('partial')
    }

    setCloning(false)
  }

  const onCloseClick = () => {
    setCloning(false)
    setFormState({})
    setStatus('')
    setSelectedOption(undefined)
    closeModal(drawerSlug)
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <Drawer slug={drawerSlug} Header={null}>
      <div className={'mt-12 grid grid-cols-[auto_min-content]'}>
        <div className={'flex flex-col gap-8'}>
          <h1 className={'text-2xl font-bold'}>Cloning an activity</h1>
          {status === 'error' && (
            <div>
              <p>
                There was an error cloning the activities. Check your console log and contact
                support.
              </p>
            </div>
          )}
          {status === 'success' && (
            <div>
              <p>Activities cloned successfully!</p>
            </div>
          )}
          {status === 'partial' && (
            <div>
              <p>
                Some activities were cloned successfully, but others failed. Check your console log
                for more information.
              </p>
            </div>
          )}
          {status === '' && (
            <>
              <p>
                <strong>Important:</strong> This action will clone the selected activities to the
                target organisation. It will neither overwrite nor delete any existing activities.
              </p>
              <p>Select the activities you wish to clone and the target organisation below.</p>
            </>
          )}
          {status === '' && (
            <>
              <div>
                {availableOptions?.map((section) => (
                  <div key={section.section} className={'mb-12 max-w-fit'}>
                    <h2 className={'text-xl font-bold'}>{section.section}</h2>
                    <ul>
                      {section.fields?.map((field) => (
                        <li key={field.key} className={'flex select-none gap-2 p-2'}>
                          <input
                            type="checkbox"
                            id={field.key}
                            name={field.key}
                            defaultChecked={formState[field.key]}
                            onClick={() => onCheckboxChange(field.key)}
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
                <h2 className={'text-xl font-bold'}>Select target organisation</h2>
                <Select
                  options={targetOrganisations}
                  value={selectedOption}
                  onChange={onOrganisationChange as any}
                  isCreatable={false}
                  isClearable={false}
                />
              </div>
            </>
          )}
          {cloning && (
            <div>
              <p>Cloning activities... Please wait!</p>
            </div>
          )}
          {status === '' && (
            <>
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
            </>
          )}
          {status === 'error' ||
            (status === 'success' && (
              <Button
                buttonStyle="secondary"
                className={`${baseClass}__cancel`}
                onClick={onCloseClick}>
                {t('general:close')}
              </Button>
            ))}
          {status === 'partial' && (
            <Button
              buttonStyle="secondary"
              className={`${baseClass}__cancel`}
              onClick={onCloseClick}>
              {t('general:close')}
            </Button>
          )}
        </div>
        <div>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__cancel`}
            onClick={onCloseClick}>
            <CloseMenuIcon />
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
