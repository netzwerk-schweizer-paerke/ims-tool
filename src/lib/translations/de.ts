export const de = {
  activityBlock: {
    flows: {
      noFlows: 'Keine Prozesse definiert',
      title: 'Prozesse',
    },
    infos: {
      norms: 'Normen',
      support: 'Unterstützende Informationen',
    },
    input: {
      title: 'Input',
    },
    output: {
      title: 'Output',
    },
    tasks: {
      noTasks: 'Keine Prozesse definiert',
      title: 'Listen',
    },
    title: 'Prozessgruppe',
  },
  activityLandscape: {
    blockHasNoName: 'Block hat keinen Namen',
    noBlocks: 'Keine Blöcke',
    noContent: 'Keine Aktivitäten oder Prozesse definiert. Erstellen Sie zuerst einige.',
    title: 'Prozesslandschaft',
  },
  admin: {
    links: {
      activityLandscape: 'Prozesslandschaft',
      dashboard: 'Dashboard',
      title: 'Links',
    },
    selectOrganisations: {
      noOrganisations:
        'Ihrem Benutzer wurden keine Organisationen zugewiesen. Bitte wenden Sie sich an Ihren Administrator.',
      orgLanguageMismatch:
        'Bitte beachten Sie, dass Sie aktuell Inhalte nicht in der Organisationssprache bearbeiten.',
      reset: 'Standardsprache wählen',
      title: 'Organisation auswählen',
    },
  },
  cloneActivity: {
    button: 'Aktivitäten klonen',
    clone: 'Aktivitäten klonen',
    cloning: 'Klonen...',
    form: {
      activities: 'Aktivitäten',
      instructions:
        'Wählen Sie unten die Aktivitäten aus, die Sie klonen möchten, und die Zielorganisation.',
      targetOrganisation: 'Zielorganisation auswählen',
    },
    info: {
      files: {
        description:
          'Alle angehängten Dateien werden in die neue Organisation kopiert. Jede Datei wird nur einmal kopiert, auch wenn sie mehrfach verwendet wird.',
        title: 'Dateien & Dokumente',
      },
      language: {
        description:
          'Nur Inhalte in Ihrer aktuellen Sprache (z.B. Deutsch bei DE-Ansicht) werden kopiert.',
        title: 'Sprache',
      },
      missingFiles: {
        description:
          'Wenn eine Datei nicht gefunden werden kann, wird die Aktivität trotzdem geklont, aber ohne diese Datei. Sie erhalten einen Bericht über fehlende Dateien.',
        title: 'Fehlende Dateien',
      },
      safety: {
        description:
          'Falls etwas schief geht, werden alle Änderungen automatisch rückgängig gemacht, um unvollständige Kopien zu verhindern.',
        title: 'Sicherheit',
      },
      sharedResources: {
        description:
          'Öffentliche Dokumente bleiben verknüpft, werden aber nicht kopiert (sie sind bereits für alle Organisationen verfügbar).',
        title: 'Geteilte Ressourcen',
      },
      tasks: {
        description:
          'Alle verbundenen Aufgabenabläufe und Aufgabenlisten werden zusammen mit der Aktivität kopiert.',
        title: 'Aufgaben',
      },
      title: 'Was wird geklont?',
    },
    processing: 'Aktivitäten werden geklont... Bitte warten!',
    results: {
      activityComparison: 'Aktivitätenvergleich:',
      complete: 'Abgeschlossen',
      completeness: 'Vollständigkeit:',
      completenessAnalysis: 'Vollständigkeitsanalyse:',
      detailedResults: 'Detaillierte Ergebnisse',
      error: 'Fehler:',
      failedTask: 'Fehlgeschlagene Aufgabe:',
      failedTasks: 'Fehlgeschlagene Aufgaben:',
      fieldsModified: 'Felder geändert:',
      fieldsPreserved: 'Felder beibehalten:',
      fieldsRemoved: 'Felder entfernt:',
      file: 'Datei:',
      missingDocuments: 'Fehlende Dokumentdateien:',
      sourceActivity: 'Quellaktivität:',
      summary: 'Zusammenfassung:',
      usageInformation: 'Verwendungsinformationen:',
      variant: 'Variante:',
    },
    status: {
      allFailed: 'Alle Aktivitäten konnten nicht geklont werden',
      allSuccess: 'Alle Aktivitäten erfolgreich geklont!',
      failedToClone: 'Klonen fehlgeschlagen:',
      partialSuccess: 'Teilerfolg: {{succeeded}} erfolgreich, {{failed}} fehlgeschlagen',
      successfullyCloned: 'Erfolgreich geklont:',
      withIssues: 'Mit Problemen geklont',
      withWarnings: 'Aktivitäten mit Warnungen geklont',
      withWarningsDescription:
        'Einige Aktivitäten wurden erfolgreich geklont, aber mit fehlenden Dateien oder unvollständigen Daten.',
    },
    switchToTarget: 'Zur Zielorganisation wechseln',
    table: {
      activityId: 'Aktivitäts-ID',
      blocksCount: 'Anzahl Blöcke',
      clone: 'Klon',
      completeness: 'Vollständigkeit',
      directFileAttachments: 'Direkte Dateianhänge',
      hasDescription: 'Hat Beschreibung',
      metric: 'Metrik',
      missingFiles: 'Fehlende Dateien',
      name: 'Name',
      publicDocuments: 'Öffentliche Dokumentdateien',
      relatedEntities: 'Verwandte Entitäten',
      richTextDocuments: 'Rich-Text-Dokumentdateien',
      source: 'Quelle',
      status: 'Status',
      taskFlowBlocks: 'Prozess-Blöcke',
      taskFlows: 'Prozesse',
      taskListBlocks: 'Listen-Blöcke',
      taskLists: 'Listen',
      totalActivities: 'Gesamte Aktivitäten:',
      totalDocumentFiles: 'Gesamte Dokumentdateien:',
      totalDocumentUsages: 'Gesamtanzahl Dokumentdateien-Verwendungen',
      totalMissingFiles: 'Fehlende Dateien:',
      totalRelatedEntities: 'Gesamte verwandte Entitäten:',
      totalTasks: 'Gesamtanzahl Aufgaben',
      uniqueDocuments: 'Eindeutige Dokumentdateien',
      variant: 'Variante',
    },
    title: 'Aktivität klonen',
  },
  cloneTaskFlow: {
    button: 'Prozesse klonen',
    clone: 'Prozesse klonen',
    cloning: 'Klonen...',
    error: '❌ Klonvorgang fehlgeschlagen',
    errorMessage: 'Bitte überprüfen Sie die obigen Fehler und versuchen Sie es erneut.',
    failed: 'fehlgeschlagen',
    failedClones: '❌ Fehlgeschlagene Klone',
    info: {
      blocks: {
        description: 'Alle Prozessblöcke und ihre Verbindungen werden kopiert.',
        title: 'Prozessblöcke',
      },
      files: {
        description: 'Alle angehängten Dateien werden in die neue Organisation kopiert.',
        title: 'Dateien & Dokumente',
      },
      language: {
        description: 'Nur Inhalte in Ihrer aktuellen Sprache werden kopiert.',
        title: 'Sprache',
      },
      safety: {
        description: 'Bei Fehlern werden alle Änderungen automatisch rückgängig gemacht.',
        title: 'Sicherheit',
      },
      title: 'Was wird geklont?',
    },
    partial: '⚠️ Teilweiser Erfolg',
    processing: 'Prozesse werden geklont... Bitte warten!',
    results: {
      comparison: 'Prozessvergleich:',
      completeness: 'Vollständigkeit:',
      sourceItem: 'Quellprozess:',
      summary: 'Zusammenfassung:',
    },
    selected: 'ausgewählt',
    selectTaskFlows: 'Prozesse zum Klonen auswählen',
    status: {
      allSuccess: 'Alle Prozesse erfolgreich geklont!',
    },
    succeeded: 'erfolgreich',
    success: '✅ Alle Prozesse erfolgreich geklont',
    successfulClones: '✅ Erfolgreiche Klone',
    successMessage: 'Die Prozesse wurden erfolgreich in die Zielorganisation geklont.',
    switchToTarget: 'Zur Zielorganisation wechseln',
    table: {
      blocksCount: 'Anzahl Blöcke',
      clone: 'Klon',
      directFileAttachments: 'Direkte Dateianhänge',
      itemId: 'Prozess-ID',
      itemsCount: 'Anzahl Elemente',
      metric: 'Metrik',
      publicDocuments: 'Öffentliche Dokumentdateien',
      richTextDocuments: 'Rich-Text-Dokumentdateien',
      source: 'Quelle',
      totalDocumentUsages: 'Gesamte Dokumentdatei-Verwendungen',
      uniqueDocuments: 'Eindeutige Dokumentdateien',
    },
    targetOrganisation: 'Zielorganisation',
    title: 'Prozesse klonen',
  },
  cloneTaskList: {
    button: 'Listen klonen',
    clone: 'Listen klonen',
    cloning: 'Klonen...',
    error: '❌ Klonvorgang fehlgeschlagen',
    errorMessage: 'Bitte überprüfen Sie die obigen Fehler und versuchen Sie es erneut.',
    failed: 'fehlgeschlagen',
    failedClones: '❌ Fehlgeschlagene Klone',
    info: {
      files: {
        description:
          'Alle an Aufgabenelemente angehängten Dateien werden kopiert. Jede Datei wird nur einmal kopiert, auch wenn sie an mehreren Stellen verwendet wird.',
        title: 'Dateien & Dokumente',
      },
      items: {
        description:
          'Alle Aufgabenelemente in den ausgewählten Listen werden kopiert, wobei ihre Reihenfolge und Struktur erhalten bleibt.',
        title: 'Aufgabenelemente',
      },
      language: {
        description:
          'Nur Inhalte in Ihrer aktuellen Sprache werden in die Zielorganisation kopiert.',
        title: 'Sprache',
      },
      safety: {
        description:
          'Dieser Vorgang ist sicher. Bei Fehlern werden alle Änderungen automatisch rückgängig gemacht, um unvollständige Kopien zu verhindern.',
        title: 'Sicherheit',
      },
      title: 'Was wird geklont?',
    },
    partial: '⚠️ Teilweiser Erfolg',
    processing: 'Listen werden geklont... Bitte warten!',
    results: {
      comparison: 'Listenvergleich:',
      completeness: 'Vollständigkeit:',
      sourceItem: 'Quellliste:',
      summary: 'Zusammenfassung:',
    },
    selected: 'ausgewählt',
    selectTaskLists: 'Listen zum Klonen auswählen',
    status: {
      allSuccess: 'Alle Listen erfolgreich geklont!',
    },
    succeeded: 'erfolgreich',
    success: '✅ Alle Listen erfolgreich geklont',
    successfulClones: '✅ Erfolgreiche Klone',
    successMessage: 'Die Listen wurden erfolgreich in die Zielorganisation geklont.',
    switchToTarget: 'Zur Zielorganisation wechseln',
    table: {
      blocksCount: 'Anzahl Blöcke',
      clone: 'Klon',
      directFileAttachments: 'Direkte Dateianhänge',
      itemId: 'Listen-ID',
      itemsCount: 'Anzahl Elemente',
      metric: 'Metrik',
      publicDocuments: 'Öffentliche Dokumentdateien',
      richTextDocuments: 'Rich-Text-Dokumentdateien',
      source: 'Quelle',
      totalDocumentUsages: 'Gesamte Dokumentdatei-Verwendungen',
      uniqueDocuments: 'Eindeutige Dokumentdateien',
    },
    targetOrganisation: 'Zielorganisation',
    title: 'Listen klonen',
  },
  cloning: {
    andMoreItems: '... und {{count}} weitere',
    failed: 'Fehlgeschlagen',
    loadingMessage: 'Bitte warten Sie, während wir Ihre Daten verarbeiten...',
    missingFilesCount: 'Fehlende Dateien ({{count}}):',
    systemErrors: 'Systemfehler:',
  },
  common: {
    back: 'Zurück',
    boolean: {
      false: 'Falsch',
      true: 'Wahr',
    },
    continue: 'Weiter',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    lastUpdated: 'Zuletzt aktualisiert',
    noContentDefined: 'Kein Inhalt definiert',
  },
  flowBlock: {
    table: {
      keypoints: 'Merkpunkte',
      responsibility: 'Verantwortung',
      tools: 'Werkzeuge',
    },
    title: 'Flow',
  },
  general: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    selectAll: 'Alle auswählen',
    switching: 'Wechseln...',
  },
  listBlock: {
    table: {
      keypoints: 'Merkpunkte',
      responsibility: 'Verantwortung',
      tools: 'Werkzeuge',
    },
    title: 'Aufgaben',
  },
}
