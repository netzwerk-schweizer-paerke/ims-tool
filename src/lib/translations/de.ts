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
    },
    table: {
      metric: 'Metrik',
      source: 'Quelle',
      clone: 'Klon',
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
      taskFlows: 'Aufgabenabläufe',
      taskLists: 'Aufgabenlisten',
      taskFlowBlocks: 'Aufgabenablauf-Blöcke',
      taskListBlocks: 'Aufgabenlisten-Blöcke',
      completeness: 'Vollständigkeit',
    },
  },
}
