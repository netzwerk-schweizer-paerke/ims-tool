/**
 * Test script for activity clone endpoint with statistics
 * Uses the existing http-client with API key authentication
 */

import { apiClient, getActivity } from './http-client'

interface CloneStatistics {
  source: {
    id: number
    name: string
    hasDescription: boolean
    variant: string
    blocksCount: number
    filesCount: number
    blockTypes: string[]
    totalTasks: number
    taskFlowsCount?: number
    taskListsCount?: number
    taskFlowBlocksCount?: number
    taskListBlocksCount?: number
    fieldsPopulated: string[]
  }
  cloned: {
    id: number
    name: string
    hasDescription: boolean
    variant: string
    blocksCount: number
    filesCount: number
    blockTypes: string[]
    totalTasks: number
    documentsCloned: number
    taskFlowsCloned: number
    taskListsCloned: number
    taskFlowBlocksCloned?: number
    taskListBlocksCloned?: number
  }
  completeness: {
    percentComplete: number
    fieldsPreserved: string[]
    fieldsModified: string[]
    fieldsRemoved: string[]
  }
  errors: {
    missingFiles: {
      documentId: number
      documentName: string
      fileName: string
      error: string
    }[]
    failedTasks: {
      taskId: number
      taskType: string
      error: string
    }[]
  }
}

interface CloneResponse {
  message: string
  activityId: number
  statistics: CloneStatistics
}

async function testActivityCloneWithStatistics(
  sourceActivityId: number,
  targetOrgId: number,
): Promise<void> {
  console.log('='.repeat(80))
  console.log('ACTIVITY CLONE TEST WITH STATISTICS')
  console.log('='.repeat(80))
  console.log(`Source Activity ID: ${sourceActivityId}`)
  console.log(`Target Organization ID: ${targetOrgId}`)
  console.log()

  try {
    // Step 1: Get source activity details before cloning
    console.log('📖 Fetching source activity details...')
    const sourceResponse = await getActivity(sourceActivityId, 2)

    if (!sourceResponse.ok) {
      throw new Error(`Failed to fetch source activity: ${sourceResponse.error}`)
    }

    const sourceActivity = sourceResponse.data
    console.log(`✓ Source activity: "${sourceActivity.name}" (ID: ${sourceActivity.id})`)
    console.log(`  Variant: ${sourceActivity.variant}`)
    console.log(`  Blocks: ${sourceActivity.blocks?.length || 0}`)
    console.log(`  Files: ${sourceActivity.files?.length || 0}`)
    console.log()

    // Step 2: Clone the activity
    console.log('🔄 Cloning activity...')
    const cloneResponse = await apiClient.post<CloneResponse>(
      `/api/activities/${sourceActivityId}/organisation/${targetOrgId}`,
    )

    if (!cloneResponse.ok) {
      throw new Error(`Clone failed: ${cloneResponse.error}`)
    }

    const { activityId: clonedId, statistics } = cloneResponse.data
    console.log(`✓ Activity cloned successfully! New ID: ${clonedId}`)

    // Debug: Show raw statistics
    console.log('\n📋 RAW STATISTICS OBJECT:')
    console.log(JSON.stringify(statistics, null, 2))
    console.log()

    // Step 3: Display statistics
    console.log('📊 CLONE STATISTICS')
    console.log('-'.repeat(40))

    console.log('\n📄 SOURCE ACTIVITY:')
    console.log(`  ID: ${statistics.source.id}`)
    console.log(`  Name: ${statistics.source.name}`)
    console.log(`  Has Description: ${statistics.source.hasDescription ? 'Yes' : 'No'}`)
    console.log(`  Variant: ${statistics.source.variant}`)
    console.log(`  Blocks Count: ${statistics.source.blocksCount}`)
    console.log(`  Files Count: ${statistics.source.filesCount}`)
    console.log(`  Block Types: ${statistics.source.blockTypes.join(', ') || 'None'}`)
    console.log(`  Total Tasks: ${statistics.source.totalTasks}`)
    if (statistics.source.taskFlowsCount !== undefined) {
      console.log(`  Task Flows: ${statistics.source.taskFlowsCount}`)
    }
    if (statistics.source.taskListsCount !== undefined) {
      console.log(`  Task Lists: ${statistics.source.taskListsCount}`)
    }
    if (statistics.source.taskFlowBlocksCount !== undefined) {
      console.log(`  Task Flow Blocks Total: ${statistics.source.taskFlowBlocksCount}`)
    }
    if (statistics.source.taskListBlocksCount !== undefined) {
      console.log(`  Task List Blocks Total: ${statistics.source.taskListBlocksCount}`)
    }
    console.log(`  Fields Populated: ${statistics.source.fieldsPopulated.join(', ')}`)

    console.log('\n📄 CLONED ACTIVITY:')
    console.log(`  ID: ${statistics.cloned.id}`)
    console.log(`  Name: ${statistics.cloned.name}`)
    console.log(`  Has Description: ${statistics.cloned.hasDescription ? 'Yes' : 'No'}`)
    console.log(`  Variant: ${statistics.cloned.variant}`)
    console.log(`  Blocks Count: ${statistics.cloned.blocksCount}`)
    console.log(`  Files Count: ${statistics.cloned.filesCount}`)
    console.log(`  Block Types: ${statistics.cloned.blockTypes.join(', ') || 'None'}`)
    console.log(`  Total Tasks: ${statistics.cloned.totalTasks}`)
    console.log(`  Documents Cloned: ${statistics.cloned.documentsCloned}`)
    console.log(`  Task Flows Cloned: ${statistics.cloned.taskFlowsCloned}`)
    console.log(`  Task Lists Cloned: ${statistics.cloned.taskListsCloned}`)
    if (statistics.cloned.taskFlowBlocksCloned !== undefined) {
      console.log(`  Task Flow Blocks Cloned: ${statistics.cloned.taskFlowBlocksCloned}`)
    }
    if (statistics.cloned.taskListBlocksCloned !== undefined) {
      console.log(`  Task List Blocks Cloned: ${statistics.cloned.taskListBlocksCloned}`)
    }

    console.log('\n✅ COMPLETENESS ANALYSIS:')
    console.log(`  Completeness Score: ${statistics.completeness.percentComplete}%`)
    console.log(
      `  Fields Preserved: ${statistics.completeness.fieldsPreserved.join(', ') || 'None'}`,
    )
    console.log(`  Fields Modified: ${statistics.completeness.fieldsModified.join(', ') || 'None'}`)
    console.log(`  Fields Removed: ${statistics.completeness.fieldsRemoved.join(', ') || 'None'}`)

    // Display errors if any
    if (
      statistics.errors &&
      (statistics.errors.missingFiles.length > 0 || statistics.errors.failedTasks.length > 0)
    ) {
      console.log('\n⚠️  ERRORS ENCOUNTERED:')

      if (statistics.errors.missingFiles.length > 0) {
        console.log('  Missing Files:')
        for (const file of statistics.errors.missingFiles) {
          console.log(`    ❌ Document ${file.documentId}: "${file.documentName}"`)
          console.log(`       File: ${file.fileName}`)
          console.log(`       Error: ${file.error}`)
        }
      }

      if (statistics.errors.failedTasks.length > 0) {
        console.log('  Failed Tasks:')
        for (const task of statistics.errors.failedTasks) {
          console.log(`    ❌ Task ${task.taskId} (${task.taskType})`)
          console.log(`       Error: ${task.error}`)
        }
      }
    }

    // Step 4: Verify cloned activity
    console.log('\n🔍 Verifying cloned activity...')
    const clonedResponse = await getActivity(clonedId, 2)

    if (!clonedResponse.ok) {
      throw new Error(`Failed to fetch cloned activity: ${clonedResponse.error}`)
    }

    const clonedActivity = clonedResponse.data
    console.log(`✓ Cloned activity verified: "${clonedActivity.name}"`)
    console.log(`  Organization: ${clonedActivity.organisation}`)

    // Step 5: Summary
    console.log('\n' + '='.repeat(80))
    console.log('SUMMARY')
    console.log('='.repeat(80))

    const hasErrors =
      statistics.errors &&
      (statistics.errors.missingFiles.length > 0 || statistics.errors.failedTasks.length > 0)
    const isComplete = statistics.completeness.percentComplete === 100 && !hasErrors
    const statusIcon = isComplete ? '✅' : hasErrors ? '⚠️' : '✅'

    console.log(
      `${statusIcon} Clone Status: ${isComplete ? 'COMPLETE' : hasErrors ? 'PARTIAL (WITH ERRORS)' : 'PARTIAL'}`,
    )
    console.log(`   Completeness: ${statistics.completeness.percentComplete}%`)

    if (statistics.cloned.documentsCloned > 0) {
      console.log(`   📎 ${statistics.cloned.documentsCloned} document(s) cloned successfully`)
    }

    if (statistics.errors && statistics.errors.missingFiles.length > 0) {
      console.log(
        `   ❌ ${statistics.errors.missingFiles.length} document(s) failed to clone (missing files)`,
      )
    }

    if (statistics.cloned.taskFlowsCloned > 0 || statistics.cloned.taskListsCloned > 0) {
      console.log(`   🔄 ${statistics.cloned.taskFlowsCloned} task flow(s) cloned`)
      console.log(`   📝 ${statistics.cloned.taskListsCloned} task list(s) cloned`)
    }

    if (statistics.completeness.fieldsModified.length > 0) {
      console.log(`   ⚠️  Modified fields: ${statistics.completeness.fieldsModified.join(', ')}`)
    }

    if (statistics.completeness.fieldsRemoved.length > 0) {
      console.log(`   ❌ Removed fields: ${statistics.completeness.fieldsRemoved.join(', ')}`)
    }

    console.log('\n✨ Test completed successfully!')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    throw error
  }
}

// Function to find activities with various characteristics for testing
async function findTestableActivities(): Promise<void> {
  console.log('🔍 Finding testable activities...\n')

  const response = await apiClient.get('/api/activities?limit=20&depth=1')

  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.error}`)
  }

  const activities = response.data.docs || []

  // Categorize activities
  const withFiles = activities.filter((a: any) => a.files?.length > 0)
  const withBlocks = activities.filter((a: any) => a.blocks?.length > 0)
  const withTasks = activities.filter((a: any) => {
    return a.blocks?.some((b: any) => b.relations?.tasks?.length > 0)
  })

  console.log(`Found ${activities.length} activities:`)
  console.log(`  📎 With files: ${withFiles.length}`)
  console.log(`  🔲 With blocks: ${withBlocks.length}`)
  console.log(`  📋 With tasks: ${withTasks.length}`)

  if (withTasks.length > 0) {
    console.log('\nActivities with tasks (good for testing):')
    withTasks.slice(0, 5).forEach((a: any) => {
      const taskCount = a.blocks.reduce((sum: number, b: any) => {
        return sum + (b.relations?.tasks?.length || 0)
      }, 0)
      console.log(`  - ID: ${a.id} "${a.name}" (${taskCount} tasks)`)
    })
  }

  if (withFiles.length > 0) {
    console.log('\nActivities with files:')
    withFiles.slice(0, 5).forEach((a: any) => {
      console.log(`  - ID: ${a.id} "${a.name}" (${a.files.length} files)`)
    })
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--find')) {
    // Find testable activities
    await findTestableActivities()
  } else {
    // Run the test with provided or default values
    const sourceActivityId = parseInt(args[0]) || 1
    const targetOrgId = parseInt(args[1]) || 2

    await testActivityCloneWithStatistics(sourceActivityId, targetOrgId)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { testActivityCloneWithStatistics, findTestableActivities }
