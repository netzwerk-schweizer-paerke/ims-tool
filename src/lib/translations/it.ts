export const it = {
  activityBlock: {
    flows: {
      noFlows: 'Nessun flusso di processo definito',
      title: 'Flussi',
    },
    infos: {
      norms: 'Norme',
      support: 'Supporto',
    },
    input: {
      title: 'Input',
    },
    output: {
      title: 'Output',
    },
    tasks: {
      noTasks: 'Nessun compito definito',
      title: 'Compiti',
    },
    title: 'Blocco di attività',
  },
  activityLandscape: {
    blockHasNoName: 'Il blocco non ha un nome',
    noBlocks: 'Nessun blocco',
    noContent: 'Nessuna attività o processo definito. Creane alcuni prima.',
    title: 'Panorama delle attività',
  },
  admin: {
    links: {
      activityLandscape: 'Panorama delle attività',
      dashboard: 'Pannello di controllo',
      title: 'Collegamenti',
    },
    selectOrganisations: {
      noOrganisations:
        'Nessuna organizzazione è stata assegnata al tuo utente. Contatta un amministratore.',
      orgLanguageMismatch:
        "Si prega di notare che attualmente si stanno modificando contenuti non nella lingua dell'organizzazione.",
      reset: 'Ripristina la lingua predefinita',
      title: 'Scegli organizzazione attiva',
    },
  },
  cloneActivity: {
    button: 'Clona attività',
    clone: 'Clona attività',
    cloning: 'Clonazione...',
    form: {
      activities: 'Attività',
      instructions:
        "Seleziona le attività che desideri clonare e l'organizzazione di destinazione qui sotto.",
      targetOrganisation: 'Seleziona organizzazione di destinazione',
    },
    info: {
      files: {
        description:
          'Tutti i file allegati verranno copiati nella nuova organizzazione. Ogni file viene copiato solo una volta, anche se utilizzato più volte.',
        title: 'File e documenti',
      },
      language: {
        description:
          'Solo il contenuto nella tua lingua attuale (ad es. italiano in visualizzazione IT) verrà copiato.',
        title: 'Lingua',
      },
      missingFiles: {
        description:
          "Se un file non può essere trovato, l'attività verrà comunque clonata ma senza quel file. Riceverai un rapporto sui file mancanti.",
        title: 'File mancanti',
      },
      safety: {
        description:
          'Se qualcosa va storto, tutte le modifiche vengono automaticamente annullate per evitare copie incomplete.',
        title: 'Sicurezza',
      },
      sharedResources: {
        description:
          'I documenti pubblici rimangono collegati ma non vengono copiati (sono già disponibili per tutte le organizzazioni).',
        title: 'Risorse condivise',
      },
      tasks: {
        description:
          "Tutti i flussi di lavoro e le liste di compiti collegati verranno copiati insieme all'attività.",
        title: 'Compiti',
      },
      title: 'Cosa verrà clonato?',
    },
    processing: 'Clonazione attività in corso... Attendere!',
    results: {
      activityComparison: 'Confronto attività:',
      complete: 'Completo',
      completeness: 'Completezza:',
      completenessAnalysis: 'Analisi completezza:',
      detailedResults: 'Risultati dettagliati',
      error: 'Errore:',
      failedTask: 'Compito fallito:',
      failedTasks: 'Compiti falliti:',
      fieldsModified: 'Campi modificati:',
      fieldsPreserved: 'Campi preservati:',
      fieldsRemoved: 'Campi rimossi:',
      file: 'File:',
      missingDocuments: 'File documento mancanti:',
      sourceActivity: 'Attività sorgente:',
      summary: 'Riassunto:',
      usageInformation: 'Informazioni utilizzo:',
      variant: 'Variante:',
    },
    status: {
      allFailed: 'Tutte le attività sono fallite nella clonazione',
      allSuccess: 'Tutte le attività sono state clonate con successo!',
      failedToClone: 'Fallite nella clonazione:',
      partialSuccess: 'Successo parziale: {{succeeded}} riuscite, {{failed}} fallite',
      successfullyCloned: 'Clonate con successo:',
      withIssues: 'Clonate con problemi',
      withWarnings: 'Attività clonate con avvisi',
      withWarningsDescription:
        'Alcune attività sono state clonate con successo ma con file mancanti o dati parziali.',
    },
    switchToTarget: "Passa all'organizzazione di destinazione",
    table: {
      activityId: 'ID Attività',
      blocksCount: 'Numero blocchi',
      clone: 'Clone',
      completeness: 'Completezza',
      directFileAttachments: 'Allegati file diretti',
      hasDescription: 'Ha descrizione',
      metric: 'Metrica',
      missingFiles: 'File mancanti',
      name: 'Nome',
      publicDocuments: 'File documento pubblici',
      relatedEntities: 'Entità correlate',
      richTextDocuments: 'File documento rich text',
      source: 'Sorgente',
      status: 'Stato',
      taskFlowBlocks: 'Blocchi flussi compiti',
      taskFlows: 'Flussi di compiti',
      taskListBlocks: 'Blocchi liste compiti',
      taskLists: 'Liste compiti',
      totalActivities: 'Totale attività:',
      totalDocumentFiles: 'Totale file documenti:',
      totalDocumentUsages: 'Utilizzi totali file documento',
      totalMissingFiles: 'File mancanti:',
      totalRelatedEntities: 'Totale entità correlate:',
      totalTasks: 'Compiti totali',
      uniqueDocuments: 'File documento unici',
      variant: 'Variante',
    },
    title: "Clonare un'attività",
  },
  cloneTaskFlow: {
    blocks: 'blocchi',
    button: 'Clona processi',
    clone: 'Clona processi',
    cloning: 'Clonazione...',
    error: '❌ Operazione di clonazione fallita',
    errorMessage: 'Si prega di controllare gli errori sopra e riprovare.',
    failed: 'fallito/i',
    failedClones: '❌ Cloni falliti',
    files: 'file',
    info: {
      blocks: {
        description: 'Tutti i blocchi di processo e le loro connessioni verranno copiati.',
        title: 'Blocchi di processo',
      },
      files: {
        description: 'Tutti i file allegati verranno copiati nella nuova organizzazione.',
        title: 'File e documenti',
      },
      language: {
        description: 'Solo il contenuto nella tua lingua attuale verrà copiato.',
        title: 'Lingua',
      },
      safety: {
        description: 'In caso di errore, tutte le modifiche vengono annullate automaticamente.',
        title: 'Sicurezza',
      },
      title: 'Cosa verrà clonato?',
    },
    partial: '⚠️ Successo parziale',
    processing: 'Clonazione dei processi... Attendere prego!',
    results: {
      comparison: 'Confronto processi:',
      completeness: 'Completezza:',
      sourceItem: 'Processo di origine:',
      summary: 'Riepilogo:',
    },
    selected: 'selezionato/i',
    selectTaskFlows: 'Seleziona i processi da clonare',
    status: {
      allSuccess: 'Tutti i processi clonati con successo!',
    },
    succeeded: 'riuscito/i',
    success: '✅ Tutti i processi clonati con successo',
    successfulClones: '✅ Cloni riusciti',
    successMessage:
      "I processi sono stati clonati con successo nell'organizzazione di destinazione.",
    switchToTarget: "Passa all'organizzazione di destinazione",
    table: {
      blocksCount: 'Numero di blocchi',
      clone: 'Clone',
      directFileAttachments: 'Allegati diretti',
      itemId: 'ID processo',
      itemsCount: 'Numero di elementi',
      metric: 'Metrica',
      publicDocuments: 'File di documenti pubblici',
      richTextDocuments: 'File di documenti rich text',
      source: 'Origine',
      totalDocumentUsages: 'Utilizzi totali di file di documenti',
      uniqueDocuments: 'File di documenti unici',
    },
    targetOrganisation: 'Organizzazione di destinazione',
    title: 'Clona processi',
  },
  cloneTaskList: {
    button: 'Clona elenchi',
    clone: 'Clona elenchi',
    cloning: 'Clonazione...',
    error: '❌ Operazione di clonazione fallita',
    errorMessage: 'Si prega di controllare gli errori sopra e riprovare.',
    failed: 'fallito/i',
    failedClones: '❌ Cloni falliti',
    files: 'file',
    info: {
      files: {
        description:
          "Tutti i file allegati agli elementi dell'attività verranno copiati. Ogni file viene copiato una sola volta, anche se utilizzato in più posizioni.",
        title: 'File e documenti',
      },
      items: {
        description:
          "Tutti gli elementi dell'attività negli elenchi selezionati verranno copiati, preservando il loro ordine e la loro struttura.",
        title: "Elementi dell'attività",
      },
      language: {
        description:
          "Solo il contenuto nella tua lingua attuale verrà copiato nell'organizzazione di destinazione.",
        title: 'Lingua',
      },
      safety: {
        description:
          'Questa operazione è sicura. In caso di errore, tutte le modifiche vengono automaticamente annullate per evitare copie incomplete.',
        title: 'Sicurezza',
      },
      title: 'Cosa verrà clonato?',
    },
    items: 'elementi',
    partial: '⚠️ Successo parziale',
    processing: 'Clonazione degli elenchi... Attendere prego!',
    selected: 'selezionato/i',
    selectTaskLists: 'Seleziona gli elenchi da clonare',
    succeeded: 'riuscito/i',
    success: '✅ Tutti gli elenchi clonati con successo',
    successfulClones: '✅ Cloni riusciti',
    successMessage:
      "Gli elenchi sono stati clonati con successo nell'organizzazione di destinazione.",
    switchToTarget: "Passa all'organizzazione di destinazione",
    targetOrganisation: 'Organizzazione di destinazione',
    title: 'Clona elenchi',
  },
  cloning: {
    andMoreItems: '... e {{count}} altri',
    failed: 'Fallito',
    loadingMessage: 'Attendere mentre elaboriamo i vostri dati...',
    missingFilesCount: 'File mancanti ({{count}}):',
    systemErrors: 'Errori di sistema:',
  },
  common: {
    back: 'Indietro',
    boolean: {
      false: 'Falso',
      true: 'Vero',
    },
    continue: 'Continua',
    delete: 'Elimina',
    edit: 'Modifica',
    enableBlock: 'Attiva blocco',
    lastUpdated: 'Ultimo aggiornamento',
    noContentDefined: 'Nessun contenuto definito',
  },
  flowBlock: {
    table: {
      keypoints: 'Punti chiave',
      responsibility: 'Responsabilità',
      tools: 'Strumenti',
    },
    title: 'Flusso',
  },
  general: {
    cancel: 'Annulla',
    close: 'Chiudi',
    selectAll: 'Seleziona tutto',
    switching: 'Cambiando...',
  },
  listBlock: {
    table: {
      keypoints: 'Punti chiave',
      responsibility: 'Responsabilità',
      tools: 'Strumenti',
    },
    title: 'Lista',
  },
}
