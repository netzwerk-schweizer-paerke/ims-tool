export const en = {
  activityBlock: {
    flows: {
      noFlows: 'No process flows defined',
      title: 'Flows',
    },
    infos: {
      norms: 'Norms',
      support: 'Support',
    },
    input: {
      title: 'Input',
    },
    output: {
      title: 'Output',
    },
    tasks: {
      noTasks: 'No tasks defined',
      title: 'Tasks',
    },
    title: 'Activity Block',
  },
  activityLandscape: {
    blockHasNoName: 'Block has no name',
    noBlocks: 'No blocks',
    noContent: 'No activities or processes defined yet. Create some first.',
    title: 'Activity Landscape',
  },
  admin: {
    links: {
      activityLandscape: 'Activity Landscape',
      dashboard: 'Dashboard',
      title: 'Links',
    },
    selectOrganisations: {
      noOrganisations:
        'No organisations have been assigned to you. Please contact an administrator.',
      orgLanguageMismatch:
        'Please note that you are currently editing content not in the organisation language.',
      reset: 'Reset to default language',
      title: 'Choose active organisation',
    },
  },
  cloneActivity: {
    button: 'Clone activities',
    clone: 'Clone Activities',
    cloning: 'Cloning...',
    form: {
      activities: 'Activities',
      instructions: 'Select the activities you wish to clone and the target organisation below.',
      targetOrganisation: 'Select target organisation',
    },
    info: {
      files: {
        description:
          'All attached files will be copied to the new organization. Each file is copied only once, even if used multiple times.',
        title: 'Files & Documents',
      },
      language: {
        description:
          'Only content in your current language (e.g., German if viewing in DE) will be copied.',
        title: 'Language',
      },
      missingFiles: {
        description:
          "If a file can't be found, the activity will still be cloned but without that file. You'll see a report of any missing files.",
        title: 'Missing Files',
      },
      safety: {
        description:
          'If something goes wrong, all changes are automatically undone to prevent incomplete copies.',
        title: 'Safety',
      },
      sharedResources: {
        description:
          "Public documents stay linked but aren't copied (they're already available to all organizations).",
        title: 'Shared Resources',
      },
      tasks: {
        description:
          'All connected task flows and task lists will be copied along with the activity.',
        title: 'Tasks',
      },
      title: 'What will be cloned?',
    },
    processing: 'Cloning activities... Please wait!',
    results: {
      activityComparison: 'Activity Comparison:',
      complete: 'Complete',
      completeness: 'Completeness:',
      completenessAnalysis: 'Completeness Analysis:',
      detailedResults: 'Detailed Results',
      error: 'Error:',
      failedTask: 'Failed task:',
      failedTasks: 'Failed Tasks:',
      fieldsModified: 'Fields modified:',
      fieldsPreserved: 'Fields preserved:',
      fieldsRemoved: 'Fields removed:',
      file: 'File:',
      missingDocuments: 'Missing Document files:',
      sourceActivity: 'Source Activity:',
      summary: 'Summary:',
      usageInformation: 'Usage Information:',
      variant: 'Variant:',
    },
    status: {
      allFailed: 'All activities failed to clone',
      allSuccess: 'All activities cloned successfully!',
      failedToClone: 'Failed to clone:',
      partialSuccess: 'Partial success: {{succeeded}} succeeded, {{failed}} failed',
      successfullyCloned: 'Successfully cloned:',
      withIssues: 'Cloned with Issues',
      withWarnings: 'Activities cloned with warnings',
      withWarningsDescription:
        'Some activities were cloned successfully but with missing files or partial data.',
    },
    switchToTarget: 'Switch to target organisation',
    table: {
      activityId: 'Activity ID',
      blocksCount: 'Blocks Count',
      clone: 'Clone',
      completeness: 'Completeness',
      directFileAttachments: 'Direct File Attachments',
      hasDescription: 'Has Description',
      metric: 'Metric',
      missingFiles: 'Missing Files',
      name: 'Name',
      publicDocuments: 'Public Document files',
      relatedEntities: 'Related Entities',
      richTextDocuments: 'Rich Text Document files',
      source: 'Source',
      status: 'Status',
      taskFlowBlocks: 'Task Flow Blocks',
      taskFlows: 'Task Flows',
      taskListBlocks: 'Task List Blocks',
      taskLists: 'Task Lists',
      totalActivities: 'Total Activities:',
      totalDocumentFiles: 'Total Document Files:',
      totalDocumentUsages: 'Total Document file Usages',
      totalMissingFiles: 'Missing Files:',
      totalRelatedEntities: 'Total Related Entities:',
      totalTasks: 'Total Tasks',
      uniqueDocuments: 'Unique Document files',
      variant: 'Variant',
    },
    title: 'Cloning an activity',
  },
  cloneTaskFlow: {
    button: 'Clone Processes',
    clone: 'Clone Processes',
    cloning: 'Cloning...',
    error: '❌ Clone Operation Failed',
    errorMessage: 'Please check the errors above and try again.',
    failed: 'failed',
    failedClones: '❌ Failed Clones',
    info: {
      blocks: {
        description: 'All process blocks and their connections will be copied.',
        title: 'Process Blocks',
      },
      files: {
        description: 'All attached files will be copied to the new organization.',
        title: 'Files & Documents',
      },
      language: {
        description: 'Only content in your current language will be copied.',
        title: 'Language',
      },
      safety: {
        description: 'If something goes wrong, all changes are automatically undone.',
        title: 'Safety',
      },
      title: 'What will be cloned?',
    },
    partial: '⚠️ Partial Success',
    processing: 'Cloning processes... Please wait!',
    results: {
      comparison: 'Process Comparison:',
      completeness: 'Completeness:',
      sourceItem: 'Source Process:',
      summary: 'Summary:',
    },
    selected: 'selected',
    selectTaskFlows: 'Select Processes to Clone',
    status: {
      allSuccess: 'All processes cloned successfully!',
    },
    succeeded: 'succeeded',
    success: '✅ All Processes Cloned Successfully',
    successfulClones: '✅ Successful Clones',
    successMessage: 'Processes have been successfully cloned to the target organisation.',
    switchToTarget: 'Switch to target organisation',
    table: {
      blocksCount: 'Blocks Count',
      clone: 'Clone',
      directFileAttachments: 'Direct File Attachments',
      itemId: 'Process ID',
      itemsCount: 'Items Count',
      metric: 'Metric',
      publicDocuments: 'Public Document files',
      richTextDocuments: 'Rich Text Document files',
      source: 'Source',
      totalDocumentUsages: 'Total Document file Usages',
      uniqueDocuments: 'Unique Document files',
    },
    targetOrganisation: 'Target Organisation',
    title: 'Clone Processes',
  },
  cloneTaskList: {
    button: 'Clone Lists',
    clone: 'Clone Lists',
    cloning: 'Cloning...',
    error: '❌ Clone Operation Failed',
    errorMessage: 'Please check the errors above and try again.',
    failed: 'failed',
    failedClones: '❌ Failed Clones',
    info: {
      files: {
        description:
          'All files attached to task items will be copied. Each file is copied only once, even if used in multiple places.',
        title: 'Files & Documents',
      },
      items: {
        description:
          'All task items within the selected lists will be copied, preserving their order and structure.',
        title: 'Task Items',
      },
      language: {
        description:
          'Only content in your current language will be copied to the target organisation.',
        title: 'Language',
      },
      safety: {
        description:
          'This operation is safe. If any error occurs, all changes are automatically rolled back to prevent incomplete copies.',
        title: 'Safety',
      },
      title: 'What will be cloned?',
    },
    partial: '⚠️ Partial Success',
    processing: 'Cloning lists... Please wait!',
    results: {
      comparison: 'List Comparison:',
      completeness: 'Completeness:',
      sourceItem: 'Source List:',
      summary: 'Summary:',
    },
    selected: 'selected',
    selectTaskLists: 'Select Lists to Clone',
    status: {
      allSuccess: 'All lists cloned successfully!',
    },
    succeeded: 'succeeded',
    success: '✅ All Lists Cloned Successfully',
    successfulClones: '✅ Successful Clones',
    successMessage: 'Lists have been successfully cloned to the target organisation.',
    switchToTarget: 'Switch to target organisation',
    table: {
      blocksCount: 'Blocks Count',
      clone: 'Clone',
      directFileAttachments: 'Direct File Attachments',
      itemId: 'List ID',
      itemsCount: 'Items Count',
      metric: 'Metric',
      publicDocuments: 'Public Document files',
      richTextDocuments: 'Rich Text Document files',
      source: 'Source',
      totalDocumentUsages: 'Total Document file Usages',
      uniqueDocuments: 'Unique Document files',
    },
    targetOrganisation: 'Target Organisation',
    title: 'Clone Lists',
  },
  cloning: {
    andMoreItems: '... and {{count}} more',
    failed: 'Failed',
    loadingMessage: 'Please wait while we process your data...',
    missingFilesCount: 'Missing Files ({{count}}):',
    systemErrors: 'System Errors:',
  },
  common: {
    back: 'Back',
    boolean: {
      false: 'False',
      true: 'True',
    },
    continue: 'Continue',
    delete: 'Delete',
    edit: 'Edit',
    enableBlock: 'Enable block',
    lastUpdated: 'Last updated',
    noContentDefined: 'No content defined',
  },
  dataHealth: {
    blocking: 'Blocking',
    blockingHint: 'Cloning aborts with an error on these.',
    blockNumber: 'Block {{number}}',
    button: 'Check data',
    checking: 'Checking...',
    checkThisItem: 'Check this item',
    counts:
      'Checked: {{activities}} activities, {{taskFlows}} processes, {{taskLists}} lists, {{documents}} documents',
    degrading: 'Degrading',
    degradingHint:
      'Cloning succeeds, but the copy arrives incomplete — usually without the affected file.',
    field: {
      description: 'Description',
      document: 'Document',
      files: 'Files',
      infos: 'Activity info',
      io: 'Input / Output',
      keypoints: 'Key points',
      relations: 'Linked tasks',
      responsibility: 'Responsibility',
      tools: 'Tools',
    },
    fileNumber: 'File {{number}}',
    finding: {
      crossOrgReference:
        'References {{collection}} {{id}} from organisation {{owner}}, not {{organisation}}. Another park’s content is linked from here, and a copy keeps pointing at it.',
      crossOrgReferenceFollowed:
        'References {{collection}} {{id}} from organisation {{owner}}, not {{organisation}}. Cloning reads it with the caller’s access, so the clone aborts with a 404.',
      danglingReference:
        'References {{collection}} {{id}}, which does not exist. Cloning does not follow this link, so the copy inherits a dead reference.',
      danglingReferenceFollowed:
        'References {{collection}} {{id}}, which does not exist. Cloning follows this reference and aborts with a 404.',
      documentIncomplete:
        'Missing {{fields}}. Cloning reports this file as missing and copies the activity without it.',
      malformedRichTextNoChildren: 'Rich text field: "root" has no "children" array.',
      malformedRichTextRoot: 'Rich text field: "root" is not an object.',
      missingRequiredField:
        'Required field "{{field}}" is empty in the default locale ({{locale}}). Cloning fails validation.',
      prefixOrganisationMismatch:
        'Stored under "{{prefix}}", expected "{{expected}}". The file still resolves, but the S3 layout no longer matches the park.',
      s3ObjectMissing:
        'No object at "{{key}}". The row exists but its file is gone — copies arrive without it.',
      s3ObjectUnreadable: 'Could not read "{{key}}": {{error}}',
    },
    healthy: 'No problems found. This park’s data is fully cloneable.',
    healthyDocument: 'No problems found in this item.',
    itemNumber: 'Entry {{number}}',
    jumpToBlock: 'Jump to block',
    noFindings: 'No findings',
    openRelated: 'Referenced item',
    openSource: 'Open',
    precondition: {
      apiKeyInvalid:
        'PAYLOAD_API_KEY does not authenticate — /api/users/me returns no user. Every file download during cloning fails and every activity is copied without its attachments. Keys are encrypted with PAYLOAD_SECRET, so a rotated secret invalidates them.',
      apiKeyMissing: 'PAYLOAD_API_KEY is not set.',
      apiKeyUnreachable: 'The server could not be reached to verify the key.',
      s3BucketMissing: 'S3_BUCKET is not set.',
      s3Unreachable: 'S3 is unreachable or misconfigured. File checks were skipped.',
    },
    preconditionFailed: 'Precondition not met',
    preconditionHint: 'These checks apply to the whole installation, not to a single park.',
    run: 'Run check',
    title: 'Data health check',
    titleDocument: 'Check of this item',
  },
  flowBlock: {
    table: {
      keypoints: 'Key Points',
      responsibility: 'Responsibility',
      tools: 'Tools',
    },
    title: 'Flow',
  },
  general: {
    cancel: 'Cancel',
    close: 'Close',
    selectAll: 'Select All',
    switching: 'Switching...',
  },
  listBlock: {
    table: {
      keypoints: 'Key Points',
      responsibility: 'Responsibility',
      tools: 'Tools',
    },
    title: 'List',
  },
}
