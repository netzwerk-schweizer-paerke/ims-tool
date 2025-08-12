export const en = {
  admin: {
    links: {
      dashboard: 'Dashboard',
      activityLandscape: 'Activity Landscape',
      title: 'Links',
    },
    selectOrganisations: {
      title: 'Choose active organisation',
      orgLanguageMismatch:
        'Please note that you are currently editing content not in the organisation language.',
      noOrganisations:
        'No organisations have been assigned to you. Please contact an administrator.',
      reset: 'Reset to default language',
    },
  },
  activityLandscape: {
    title: 'Activity Landscape',
    blockHasNoName: 'Block has no name',
    noBlocks: 'No blocks',
    noContent: 'No activities or processes defined yet. Create some first.',
  },
  activityBlock: {
    title: 'Activity Block',
    input: {
      title: 'Input',
    },
    tasks: {
      title: 'Tasks',
      noTasks: 'No tasks defined',
    },
    output: {
      title: 'Output',
    },
    flows: {
      title: 'Flows',
      noFlows: 'No process flows defined',
    },
    infos: {
      norms: 'Norms',
      support: 'Support',
    },
  },
  flowBlock: {
    title: 'Flow',
    table: {
      keypoints: 'Key Points',
      tools: 'Tools',
      responsibility: 'Responsibility',
    },
  },
  listBlock: {
    title: 'List',
    table: {
      keypoints: 'Key Points',
      tools: 'Tools',
      responsibility: 'Responsibility',
    },
  },
  common: {
    back: 'Back',
    edit: 'Edit',
    delete: 'Delete',
    noContentDefined: 'No content defined',
    continue: 'Continue',
    lastUpdated: 'Last updated',
    boolean: {
      true: 'True',
      false: 'False',
    },
  },
  cloneActivity: {
    button: 'Clone activities',
    title: 'Cloning an activity',
    processing: 'Cloning activities... Please wait!',
    switchToTarget: 'Switch to target organisation',
    info: {
      title: 'What will be cloned?',
      language: {
        title: 'Language',
        description:
          'Only content in your current language (e.g., German if viewing in DE) will be copied.',
      },
      files: {
        title: 'Files & Documents',
        description:
          'All attached files will be copied to the new organization. Each file is copied only once, even if used multiple times.',
      },
      missingFiles: {
        title: 'Missing Files',
        description:
          "If a file can't be found, the activity will still be cloned but without that file. You'll see a report of any missing files.",
      },
      tasks: {
        title: 'Tasks',
        description:
          'All connected task flows and task lists will be copied along with the activity.',
      },
      sharedResources: {
        title: 'Shared Resources',
        description:
          "Public documents stay linked but aren't copied (they're already available to all organizations).",
      },
      safety: {
        title: 'Safety',
        description:
          'If something goes wrong, all changes are automatically undone to prevent incomplete copies.',
      },
    },
    form: {
      instructions: 'Select the activities you wish to clone and the target organisation below.',
      activities: 'Activities',
      targetOrganisation: 'Select target organisation',
    },
    status: {
      allFailed: 'All activities failed to clone',
      allSuccess: 'All activities cloned successfully!',
      withWarnings: 'Activities cloned with warnings',
      withWarningsDescription:
        'Some activities were cloned successfully but with missing files or partial data.',
      partialSuccess: 'Partial success: {{succeeded}} succeeded, {{failed}} failed',
      successfullyCloned: 'Successfully cloned:',
      failedToClone: 'Failed to clone:',
    },
    results: {
      summary: 'Summary:',
      completeness: 'Completeness:',
      sourceActivity: 'Source Activity:',
      variant: 'Variant:',
      activityComparison: 'Activity Comparison:',
      completenessAnalysis: 'Completeness Analysis:',
      fieldsPreserved: 'Fields preserved:',
      fieldsModified: 'Fields modified:',
      fieldsRemoved: 'Fields removed:',
      missingDocuments: 'Missing Document files:',
      failedTasks: 'Failed Tasks:',
      file: 'File:',
      usageInformation: 'Usage Information:',
      error: 'Error:',
      failedTask: 'Failed task:',
    },
    table: {
      metric: 'Metric',
      source: 'Source',
      clone: 'Clone',
      activityId: 'Activity ID',
      name: 'Name',
      hasDescription: 'Has Description',
      variant: 'Variant',
      blocksCount: 'Blocks Count',
      directFileAttachments: 'Direct File Attachments',
      richTextDocuments: 'Rich Text Document files',
      publicDocuments: 'Public Document files',
      totalDocumentUsages: 'Total Document file Usages',
      uniqueDocuments: 'Unique Document files',
      totalTasks: 'Total Tasks',
      taskFlows: 'Task Flows',
      taskLists: 'Task Lists',
      taskFlowBlocks: 'Task Flow Blocks',
      taskListBlocks: 'Task List Blocks',
      completeness: 'Completeness',
    },
  },
}
