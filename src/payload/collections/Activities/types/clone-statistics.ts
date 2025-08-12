export interface CloneStatistics {
  source: {
    id: number
    name: string
    hasDescription: boolean
    variant: string
    blocksCount: number
    filesCount: number
    totalDocumentsFound?: number // Total document usages found (including duplicates)
    uniqueDocumentsFound?: number // Unique documents found (no duplicates)
    publicDocumentsFound?: number // Public document usages found
    richTextDocumentsFound?: number // Document usages found in rich text fields
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
    totalDocumentsCloned?: number // Total document usages successfully cloned (including duplicates)
    uniqueDocumentsCloned?: number // Unique documents successfully cloned (no duplicates)
    publicDocumentsPreserved?: number // Public document usages preserved
    richTextDocumentsCloned?: number // Document usages cloned from rich text fields
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
      usageLocation: string // Where the file is used in the activity
    }[]
    failedTasks: {
      taskId: number
      taskType: string
      error: string
    }[]
  }
}

export interface CloneActivityResponse {
  message: string
  activityId: number
  statistics: CloneStatistics
}
