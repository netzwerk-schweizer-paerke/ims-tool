import { apiClient } from './http-client'

async function testTranslationTracking() {
  console.log('Testing translation tracking system...\n')

  // Get an activity with metadata
  const activityId = 211

  // Fetch activity with all locales
  const response = await apiClient.get(`/api/activities/${activityId}?locale=all&depth=0`)

  if (!response.ok) {
    console.error('Failed to fetch activity:', response.error)
    return
  }

  const activity = response.data
  console.log('Activity ID:', activity.id)
  console.log('Activity Name (DE):', activity.name?.de)
  console.log('Activity Name (FR):', activity.name?.fr)
  console.log('\nTranslation Metadata:', JSON.stringify(activity.translationMeta, null, 2))

  // Now update the DE version
  console.log('\n--- Updating DE content ---')
  const updateResponse = await apiClient.patch(`/api/activities/${activityId}?locale=de`, {
    name: activity.name?.de + ' (updated)',
  })

  if (!updateResponse.ok) {
    console.error('Failed to update activity:', updateResponse.error)
    return
  }

  console.log('DE content updated successfully')

  // Fetch again to see if metadata changed
  const updatedResponse = await apiClient.get(`/api/activities/${activityId}?locale=all&depth=0`)

  if (!updatedResponse.ok) {
    console.error('Failed to fetch updated activity:', updatedResponse.error)
    return
  }

  const updatedActivity = updatedResponse.data
  console.log(
    '\nUpdated Translation Metadata:',
    JSON.stringify(updatedActivity.translationMeta, null, 2),
  )

  // Check if FR is marked as outdated
  if (updatedActivity.translationMeta?.translations?.fr?.isOutdated) {
    console.log('\n✅ SUCCESS: FR translation correctly marked as outdated after DE change')
  } else {
    console.log('\n❌ ISSUE: FR translation not marked as outdated after DE change')
  }
}

// Run the test
testTranslationTracking().catch(console.error)
