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
      switchedAwayFromDocument:
        'Sie haben die Organisation gewechselt. Die zuvor geöffnete Seite gehört zur vorherigen Organisation und ist hier nicht verfügbar.',
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
    enableBlock: 'Block aktivieren',
    lastUpdated: 'Zuletzt aktualisiert',
    noContentDefined: 'Kein Inhalt definiert',
  },
  dataHealth: {
    blocking: 'Blockierend',
    blockingHint: 'Das Klonen bricht bei diesen Punkten mit einem Fehler ab.',
    blockNumber: 'Block {{number}}',
    button: 'Daten prüfen',
    checkExternalUrls: 'Externe Links prüfen',
    checkExternalUrlsHint:
      'Ruft jeden externen Link einmal auf. Dauert etwas länger und sendet Anfragen an fremde Server.',
    checking: 'Prüfung läuft...',
    checkThisItem: 'Diesen Eintrag prüfen',
    counts:
      'Geprüft: {{activities}} Prozessgruppen, {{taskFlows}} Prozesse, {{taskLists}} Listen, {{documents}} Dokumente',
    degrading: 'Beeinträchtigend',
    degradingHint:
      'Das Klonen gelingt, aber die Kopie kommt unvollständig an — meist ohne die betroffene Datei.',
    field: {
      description: 'Beschreibung',
      document: 'Dokument',
      files: 'Dateien',
      infos: 'Aktivitätsinfos',
      io: 'Eingabe / Ausgabe',
      keypoints: 'Merkpunkte',
      relations: 'Verknüpfte Aufgaben',
      responsibility: 'Verantwortung',
      tools: 'Werkzeuge',
    },
    fileNumber: 'Datei {{number}}',
    finding: {
      crossOrgReference:
        'Verweist auf {{collection}} {{id}} aus Organisation {{owner}} statt {{organisation}}. Inhalte eines anderen Parks sind hier verlinkt, und eine Kopie zeigt weiterhin darauf.',
      crossOrgReferenceFollowed:
        'Verweist auf {{collection}} {{id}} aus Organisation {{owner}} statt {{organisation}}. Das Klonen liest diesen Datensatz mit den Rechten des Aufrufers und bricht deshalb mit einem 404 ab.',
      danglingReference:
        'Verweist auf {{collection}} {{id}}, das nicht existiert. Das Klonen folgt diesem Link nicht, die Kopie erbt also einen toten Verweis.',
      danglingReferenceFollowed:
        'Verweist auf {{collection}} {{id}}, das nicht existiert. Das Klonen folgt diesem Verweis und bricht mit einem 404 ab.',
      documentIncomplete:
        'Es fehlt: {{fields}}. Das Klonen meldet diese Datei als fehlend und kopiert die Aktivität ohne sie.',
      externalUrlMalformed: 'Link ohne gültiges Ziel: „{{url}}“',
      externalUrlNotFound: 'Externer Link antwortet mit HTTP {{status}}: {{url}}',
      externalUrlUnreachable: 'Externer Link nicht erreichbar ({{reason}}): {{url}}',
      malformedRichTextNoChildren: 'Rich-Text-Feld: "root" enthält kein "children"-Array.',
      malformedRichTextRoot: 'Rich-Text-Feld: "root" ist kein Objekt.',
      missingRequiredField:
        'Pflichtfeld "{{field}}" ist in der Standardsprache ({{locale}}) leer. Das Klonen scheitert an der Validierung.',
      prefixOrganisationMismatch:
        'Liegt unter "{{prefix}}", erwartet wäre "{{expected}}". Die Datei ist weiterhin erreichbar, aber die S3-Ablage passt nicht mehr zum Park.',
      s3ObjectMissing:
        'Kein Objekt unter "{{key}}". Der Datensatz existiert, die Datei fehlt — Kopien kommen ohne sie an.',
      s3ObjectUnreadable: '"{{key}}" konnte nicht gelesen werden: {{error}}',
    },
    healthy: 'Keine Probleme gefunden. Die Daten dieses Parks sind vollständig klonbar.',
    healthyDocument: 'Keine Probleme in diesem Eintrag gefunden.',
    itemNumber: 'Eintrag {{number}}',
    jumpToBlock: 'Zum Block springen',
    noFindings: 'Keine Befunde',
    openRelated: 'Betroffener Verweis',
    openSource: 'Öffnen',
    precondition: {
      apiKeyInvalid:
        'PAYLOAD_API_KEY authentifiziert nicht — /api/users/me liefert keinen Benutzer. Jeder Datei-Download beim Klonen scheitert, und jede Aktivität wird ohne ihre Anhänge kopiert. Schlüssel sind mit PAYLOAD_SECRET verschlüsselt; ein geändertes Secret macht sie ungültig.',
      apiKeyMissing: 'PAYLOAD_API_KEY ist nicht gesetzt.',
      apiKeyUnreachable: 'Der Server war für die Schlüsselprüfung nicht erreichbar.',
      s3BucketMissing: 'S3_BUCKET ist nicht gesetzt.',
      s3Unreachable:
        'S3 ist nicht erreichbar oder falsch konfiguriert. Dateiprüfungen wurden übersprungen.',
    },
    preconditionFailed: 'Voraussetzung nicht erfüllt',
    preconditionHint:
      'Diese Prüfungen gelten für die gesamte Installation, nicht für einen einzelnen Park.',
    run: 'Prüfung starten',
    shared: 'Geteilte Ressourcen',
    sharedHint:
      'Öffentliche Dokumente gehören allen Parks. Sie werden bewusst nicht geklont — Kopien verweisen weiterhin auf das Original. Diese Befunde betreffen daher alle Parks, nicht nur diesen.',
    title: 'Datenprüfung',
    titleDocument: 'Prüfung dieses Eintrags',
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
