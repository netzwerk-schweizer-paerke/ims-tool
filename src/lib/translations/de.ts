export const de = {
  admin: {
    links: {
      dashboard: 'Dashboard',
      activityLandscape: 'Prozesslandschaft',
      title: 'Links',
    },
    selectOrganisations: {
      title: 'Organisation auswählen',
      orgLanguageMismatch:
        'Bitte beachten Sie, dass Sie aktuell Inhalte nicht in der Organisationssprache bearbeiten.',
      noOrganisations:
        'Ihrem Benutzer wurden keine Organisationen zugewiesen. Bitte wenden Sie sich an Ihren Administrator.',
      reset: 'Standardsprache wählen',
    },
  },
  activityLandscape: {
    title: 'Prozesslandschaft',
    blockHasNoName: 'Block hat keinen Namen',
    noBlocks: 'Keine Blöcke',
    noContent: 'Keine Aktivitäten oder Prozesse definiert. Erstellen Sie zuerst einige.',
  },
  activityBlock: {
    title: 'Prozessgruppe',
    input: {
      title: 'Input',
    },
    tasks: {
      title: 'Listen',
      noTasks: 'Keine Prozesse definiert',
    },
    output: {
      title: 'Output',
    },
    flows: {
      title: 'Prozesse',
      noFlows: 'Keine Prozesse definiert',
    },
    infos: {
      norms: 'Normen',
      support: 'Unterstützende Informationen',
    },
  },
  flowBlock: {
    title: 'Flow',
    table: {
      keypoints: 'Merkpunkte',
      tools: 'Werkzeuge',
      responsibility: 'Verantwortung',
    },
  },
  listBlock: {
    title: 'Aufgaben',
    table: {
      keypoints: 'Merkpunkte',
      tools: 'Werkzeuge',
      responsibility: 'Verantwortung',
    },
  },
  common: {
    back: 'Zurück',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    noContentDefined: 'Kein Inhalt definiert',
    continue: 'Weiter',
    lastUpdated: 'Zuletzt aktualisiert',
    boolean: {
      true: 'Wahr',
      false: 'Falsch',
    },
  },
  cloneActivity: {
    button: 'Aktivitäten klonen',
    title: 'Aktivität klonen',
    processing: 'Aktivitäten werden geklont... Bitte warten!',
    switchToTarget: 'Zur Zielorganisation wechseln',
    cloning: 'Klonen...',
    clone: 'Aktivitäten klonen',
    info: {
      title: 'Was wird geklont?',
      language: {
        title: 'Sprache',
        description:
          'Nur Inhalte in Ihrer aktuellen Sprache (z.B. Deutsch bei DE-Ansicht) werden kopiert.',
      },
      files: {
        title: 'Dateien & Dokumente',
        description:
          'Alle angehängten Dateien werden in die neue Organisation kopiert. Jede Datei wird nur einmal kopiert, auch wenn sie mehrfach verwendet wird.',
      },
      missingFiles: {
        title: 'Fehlende Dateien',
        description:
          'Wenn eine Datei nicht gefunden werden kann, wird die Aktivität trotzdem geklont, aber ohne diese Datei. Sie erhalten einen Bericht über fehlende Dateien.',
      },
      tasks: {
        title: 'Aufgaben',
        description:
          'Alle verbundenen Aufgabenabläufe und Aufgabenlisten werden zusammen mit der Aktivität kopiert.',
      },
      sharedResources: {
        title: 'Geteilte Ressourcen',
        description:
          'Öffentliche Dokumente bleiben verknüpft, werden aber nicht kopiert (sie sind bereits für alle Organisationen verfügbar).',
      },
      safety: {
        title: 'Sicherheit',
        description:
          'Falls etwas schief geht, werden alle Änderungen automatisch rückgängig gemacht, um unvollständige Kopien zu verhindern.',
      },
    },
    form: {
      instructions:
        'Wählen Sie unten die Aktivitäten aus, die Sie klonen möchten, und die Zielorganisation.',
      activities: 'Aktivitäten',
      targetOrganisation: 'Zielorganisation auswählen',
    },
    status: {
      allFailed: 'Alle Aktivitäten konnten nicht geklont werden',
      allSuccess: 'Alle Aktivitäten erfolgreich geklont!',
      withWarnings: 'Aktivitäten mit Warnungen geklont',
      withWarningsDescription:
        'Einige Aktivitäten wurden erfolgreich geklont, aber mit fehlenden Dateien oder unvollständigen Daten.',
      partialSuccess: 'Teilerfolg: {{succeeded}} erfolgreich, {{failed}} fehlgeschlagen',
      successfullyCloned: 'Erfolgreich geklont:',
      failedToClone: 'Klonen fehlgeschlagen:',
      withIssues: 'Mit Problemen geklont',
    },
    results: {
      summary: 'Zusammenfassung:',
      completeness: 'Vollständigkeit:',
      sourceActivity: 'Quellaktivität:',
      variant: 'Variante:',
      activityComparison: 'Aktivitätenvergleich:',
      completenessAnalysis: 'Vollständigkeitsanalyse:',
      fieldsPreserved: 'Felder beibehalten:',
      fieldsModified: 'Felder geändert:',
      fieldsRemoved: 'Felder entfernt:',
      missingDocuments: 'Fehlende Dokumentdateien:',
      failedTasks: 'Fehlgeschlagene Aufgaben:',
      file: 'Datei:',
      usageInformation: 'Verwendungsinformationen:',
      error: 'Fehler:',
      failedTask: 'Fehlgeschlagene Aufgabe:',
      detailedResults: 'Detaillierte Ergebnisse',
      complete: 'Abgeschlossen',
    },
    table: {
      metric: 'Metrik',
      source: 'Quelle',
      clone: 'Klon',
      status: 'Status',
      activityId: 'Aktivitäts-ID',
      name: 'Name',
      hasDescription: 'Hat Beschreibung',
      variant: 'Variante',
      blocksCount: 'Anzahl Blöcke',
      directFileAttachments: 'Direkte Dateianhänge',
      richTextDocuments: 'Rich-Text-Dokumentdateien',
      publicDocuments: 'Öffentliche Dokumentdateien',
      totalDocumentUsages: 'Gesamtanzahl Dokumentdateien-Verwendungen',
      uniqueDocuments: 'Eindeutige Dokumentdateien',
      totalTasks: 'Gesamtanzahl Aufgaben',
      taskFlows: 'Prozesse',
      taskLists: 'Listen',
      taskFlowBlocks: 'Prozess-Blöcke',
      taskListBlocks: 'Listen-Blöcke',
      completeness: 'Vollständigkeit',
      relatedEntities: 'Verwandte Entitäten',
      missingFiles: 'Fehlende Dateien',
      totalActivities: 'Gesamte Aktivitäten:',
      totalRelatedEntities: 'Gesamte verwandte Entitäten:',
      totalDocumentFiles: 'Gesamte Dokumentdateien:',
      totalMissingFiles: 'Fehlende Dateien:',
    },
  },
  cloneTaskFlow: {
    button: 'Prozesse klonen',
    title: 'Prozesse klonen',
    processing: 'Prozesse werden geklont... Bitte warten!',
    switchToTarget: 'Zur Zielorganisation wechseln',
    selectTaskFlows: 'Prozesse zum Klonen auswählen',
    selected: 'ausgewählt',
    targetOrganisation: 'Zielorganisation',
    cloning: 'Klonen...',
    clone: 'Prozesse klonen',
    success: '✅ Alle Prozesse erfolgreich geklont',
    successMessage: 'Die Prozesse wurden erfolgreich in die Zielorganisation geklont.',
    error: '❌ Klonvorgang fehlgeschlagen',
    errorMessage: 'Bitte überprüfen Sie die obigen Fehler und versuchen Sie es erneut.',
    partial: '⚠️ Teilweiser Erfolg',
    succeeded: 'erfolgreich',
    failed: 'fehlgeschlagen',
    successfulClones: '✅ Erfolgreiche Klone',
    failedClones: '❌ Fehlgeschlagene Klone',
    status: {
      allSuccess: 'Alle Prozesse erfolgreich geklont!',
    },
    results: {
      summary: 'Zusammenfassung:',
      completeness: 'Vollständigkeit:',
      sourceItem: 'Quellprozess:',
      comparison: 'Prozessvergleich:',
    },
    table: {
      metric: 'Metrik',
      source: 'Quelle',
      clone: 'Klon',
      itemId: 'Prozess-ID',
      blocksCount: 'Anzahl Blöcke',
      itemsCount: 'Anzahl Elemente',
      directFileAttachments: 'Direkte Dateianhänge',
      richTextDocuments: 'Rich-Text-Dokumentdateien',
      publicDocuments: 'Öffentliche Dokumentdateien',
      totalDocumentUsages: 'Gesamte Dokumentdatei-Verwendungen',
      uniqueDocuments: 'Eindeutige Dokumentdateien',
    },
    info: {
      title: 'Was wird geklont?',
      language: {
        title: 'Sprache',
        description: 'Nur Inhalte in Ihrer aktuellen Sprache werden kopiert.',
      },
      files: {
        title: 'Dateien & Dokumente',
        description: 'Alle angehängten Dateien werden in die neue Organisation kopiert.',
      },
      blocks: {
        title: 'Prozessblöcke',
        description: 'Alle Prozessblöcke und ihre Verbindungen werden kopiert.',
      },
      safety: {
        title: 'Sicherheit',
        description: 'Bei Fehlern werden alle Änderungen automatisch rückgängig gemacht.',
      },
    },
  },
  cloneTaskList: {
    button: 'Listen klonen',
    title: 'Listen klonen',
    processing: 'Listen werden geklont... Bitte warten!',
    switchToTarget: 'Zur Zielorganisation wechseln',
    selectTaskLists: 'Listen zum Klonen auswählen',
    selected: 'ausgewählt',
    targetOrganisation: 'Zielorganisation',
    cloning: 'Klonen...',
    clone: 'Listen klonen',
    success: '✅ Alle Listen erfolgreich geklont',
    successMessage: 'Die Listen wurden erfolgreich in die Zielorganisation geklont.',
    error: '❌ Klonvorgang fehlgeschlagen',
    errorMessage: 'Bitte überprüfen Sie die obigen Fehler und versuchen Sie es erneut.',
    partial: '⚠️ Teilweiser Erfolg',
    succeeded: 'erfolgreich',
    failed: 'fehlgeschlagen',
    successfulClones: '✅ Erfolgreiche Klone',
    failedClones: '❌ Fehlgeschlagene Klone',
    status: {
      allSuccess: 'Alle Listen erfolgreich geklont!',
    },
    results: {
      summary: 'Zusammenfassung:',
      completeness: 'Vollständigkeit:',
      sourceItem: 'Quellliste:',
      comparison: 'Listenvergleich:',
    },
    table: {
      metric: 'Metrik',
      source: 'Quelle',
      clone: 'Klon',
      itemId: 'Listen-ID',
      blocksCount: 'Anzahl Blöcke',
      itemsCount: 'Anzahl Elemente',
      directFileAttachments: 'Direkte Dateianhänge',
      richTextDocuments: 'Rich-Text-Dokumentdateien',
      publicDocuments: 'Öffentliche Dokumentdateien',
      totalDocumentUsages: 'Gesamte Dokumentdatei-Verwendungen',
      uniqueDocuments: 'Eindeutige Dokumentdateien',
    },
    info: {
      title: 'Was wird geklont?',
      language: {
        title: 'Sprache',
        description:
          'Nur Inhalte in Ihrer aktuellen Sprache werden in die Zielorganisation kopiert.',
      },
      files: {
        title: 'Dateien & Dokumente',
        description:
          'Alle an Aufgabenelemente angehängten Dateien werden kopiert. Jede Datei wird nur einmal kopiert, auch wenn sie an mehreren Stellen verwendet wird.',
      },
      items: {
        title: 'Aufgabenelemente',
        description:
          'Alle Aufgabenelemente in den ausgewählten Listen werden kopiert, wobei ihre Reihenfolge und Struktur erhalten bleibt.',
      },
      safety: {
        title: 'Sicherheit',
        description:
          'Dieser Vorgang ist sicher. Bei Fehlern werden alle Änderungen automatisch rückgängig gemacht, um unvollständige Kopien zu verhindern.',
      },
    },
  },
  general: {
    selectAll: 'Alle auswählen',
    cancel: 'Abbrechen',
    close: 'Schließen',
    switching: 'Wechseln...',
  },
  cloning: {
    loadingMessage: 'Bitte warten Sie, während wir Ihre Daten verarbeiten...',
    systemErrors: 'Systemfehler:',
    missingFilesCount: 'Fehlende Dateien ({{count}}):',
    andMoreItems: '... und {{count}} weitere',
    failed: 'Fehlgeschlagen',
  },
}
