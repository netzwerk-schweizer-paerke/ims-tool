export const it = {
  admin: {
    links: {
      dashboard: 'Pannello di controllo',
      activityLandscape: 'Panorama delle attività',
      title: 'Collegamenti',
    },
    selectOrganisations: {
      title: 'Scegli organizzazione attiva',
      orgLanguageMismatch:
        "Si prega di notare che attualmente si stanno modificando contenuti non nella lingua dell'organizzazione.",
      noOrganisations:
        'Nessuna organizzazione è stata assegnata al tuo utente. Contatta un amministratore.',
      reset: 'Ripristina la lingua predefinita',
    },
  },
  activityLandscape: {
    title: 'Panorama delle attività',
    blockHasNoName: 'Il blocco non ha un nome',
    noBlocks: 'Nessun blocco',
    noContent: 'Nessuna attività o processo definito. Creane alcuni prima.',
  },
  activityBlock: {
    title: 'Blocco di attività',
    input: {
      title: 'Input',
    },
    tasks: {
      title: 'Compiti',
      noTasks: 'Nessun compito definito',
    },
    output: {
      title: 'Output',
    },
    flows: {
      title: 'Flussi',
      noFlows: 'Nessun flusso di processo definito',
    },
    infos: {
      norms: 'Norme',
      support: 'Supporto',
    },
  },
  flowBlock: {
    title: 'Flusso',
    table: {
      keypoints: 'Punti chiave',
      tools: 'Strumenti',
      responsibility: 'Responsabilità',
    },
  },
  listBlock: {
    title: 'Lista',
    table: {
      keypoints: 'Punti chiave',
      tools: 'Strumenti',
      responsibility: 'Responsabilità',
    },
  },
  common: {
    back: 'Indietro',
    edit: 'Modifica',
    delete: 'Elimina',
    noContentDefined: 'Nessun contenuto definito',
    continue: 'Continua',
    lastUpdated: 'Ultimo aggiornamento',
    boolean: {
      true: 'Vero',
      false: 'Falso',
    },
  },
  cloneActivity: {
    button: 'Clona attività',
    title: "Clonare un'attività",
    processing: 'Clonazione attività in corso... Attendere!',
    switchToTarget: "Passa all'organizzazione di destinazione",
    cloning: 'Clonazione...',
    clone: 'Clona attività',
    info: {
      title: 'Cosa verrà clonato?',
      language: {
        title: 'Lingua',
        description:
          'Solo il contenuto nella tua lingua attuale (ad es. italiano in visualizzazione IT) verrà copiato.',
      },
      files: {
        title: 'File e documenti',
        description:
          'Tutti i file allegati verranno copiati nella nuova organizzazione. Ogni file viene copiato solo una volta, anche se utilizzato più volte.',
      },
      missingFiles: {
        title: 'File mancanti',
        description:
          "Se un file non può essere trovato, l'attività verrà comunque clonata ma senza quel file. Riceverai un rapporto sui file mancanti.",
      },
      tasks: {
        title: 'Compiti',
        description:
          "Tutti i flussi di lavoro e le liste di compiti collegati verranno copiati insieme all'attività.",
      },
      sharedResources: {
        title: 'Risorse condivise',
        description:
          'I documenti pubblici rimangono collegati ma non vengono copiati (sono già disponibili per tutte le organizzazioni).',
      },
      safety: {
        title: 'Sicurezza',
        description:
          'Se qualcosa va storto, tutte le modifiche vengono automaticamente annullate per evitare copie incomplete.',
      },
    },
    form: {
      instructions:
        "Seleziona le attività che desideri clonare e l'organizzazione di destinazione qui sotto.",
      activities: 'Attività',
      targetOrganisation: 'Seleziona organizzazione di destinazione',
    },
    status: {
      allFailed: 'Tutte le attività sono fallite nella clonazione',
      allSuccess: 'Tutte le attività sono state clonate con successo!',
      withWarnings: 'Attività clonate con avvisi',
      withWarningsDescription:
        'Alcune attività sono state clonate con successo ma con file mancanti o dati parziali.',
      partialSuccess: 'Successo parziale: {{succeeded}} riuscite, {{failed}} fallite',
      successfullyCloned: 'Clonate con successo:',
      failedToClone: 'Fallite nella clonazione:',
      withIssues: 'Clonate con problemi',
    },
    results: {
      summary: 'Riassunto:',
      completeness: 'Completezza:',
      sourceActivity: 'Attività sorgente:',
      variant: 'Variante:',
      activityComparison: 'Confronto attività:',
      completenessAnalysis: 'Analisi completezza:',
      fieldsPreserved: 'Campi preservati:',
      fieldsModified: 'Campi modificati:',
      fieldsRemoved: 'Campi rimossi:',
      missingDocuments: 'File documento mancanti:',
      failedTasks: 'Compiti falliti:',
      file: 'File:',
      usageInformation: 'Informazioni utilizzo:',
      error: 'Errore:',
      failedTask: 'Compito fallito:',
      detailedResults: 'Risultati dettagliati',
      complete: 'Completo',
    },
    table: {
      metric: 'Metrica',
      source: 'Sorgente',
      clone: 'Clone',
      status: 'Stato',
      activityId: 'ID Attività',
      name: 'Nome',
      hasDescription: 'Ha descrizione',
      variant: 'Variante',
      blocksCount: 'Numero blocchi',
      directFileAttachments: 'Allegati file diretti',
      richTextDocuments: 'File documento rich text',
      publicDocuments: 'File documento pubblici',
      totalDocumentUsages: 'Utilizzi totali file documento',
      uniqueDocuments: 'File documento unici',
      totalTasks: 'Compiti totali',
      taskFlows: 'Flussi di compiti',
      taskLists: 'Liste compiti',
      taskFlowBlocks: 'Blocchi flussi compiti',
      taskListBlocks: 'Blocchi liste compiti',
      completeness: 'Completezza',
      relatedEntities: 'Entità correlate',
      missingFiles: 'File mancanti',
      totalActivities: 'Totale attività:',
      totalRelatedEntities: 'Totale entità correlate:',
      totalDocumentFiles: 'Totale file documenti:',
      totalMissingFiles: 'File mancanti:',
    },
  },
  cloneTaskFlow: {
    button: 'Clona processi',
    title: 'Clona processi',
    processing: 'Clonazione dei processi... Attendere prego!',
    switchToTarget: "Passa all'organizzazione di destinazione",
    selectTaskFlows: 'Seleziona i processi da clonare',
    selected: 'selezionato/i',
    targetOrganisation: 'Organizzazione di destinazione',
    cloning: 'Clonazione...',
    clone: 'Clona processi',
    success: '✅ Tutti i processi clonati con successo',
    blocks: 'blocchi',
    files: 'file',
    successMessage:
      "I processi sono stati clonati con successo nell'organizzazione di destinazione.",
    error: '❌ Operazione di clonazione fallita',
    errorMessage: 'Si prega di controllare gli errori sopra e riprovare.',
    partial: '⚠️ Successo parziale',
    succeeded: 'riuscito/i',
    failed: 'fallito/i',
    successfulClones: '✅ Cloni riusciti',
    failedClones: '❌ Cloni falliti',
    status: {
      allSuccess: 'Tutti i processi clonati con successo!',
    },
    results: {
      summary: 'Riepilogo:',
      completeness: 'Completezza:',
      sourceItem: 'Processo di origine:',
      comparison: 'Confronto processi:',
    },
    table: {
      metric: 'Metrica',
      source: 'Origine',
      clone: 'Clone',
      itemId: 'ID processo',
      blocksCount: 'Numero di blocchi',
      itemsCount: 'Numero di elementi',
      directFileAttachments: 'Allegati diretti',
      richTextDocuments: 'File di documenti rich text',
      publicDocuments: 'File di documenti pubblici',
      totalDocumentUsages: 'Utilizzi totali di file di documenti',
      uniqueDocuments: 'File di documenti unici',
    },
    info: {
      title: 'Cosa verrà clonato?',
      language: {
        title: 'Lingua',
        description: 'Solo il contenuto nella tua lingua attuale verrà copiato.',
      },
      files: {
        title: 'File e documenti',
        description: 'Tutti i file allegati verranno copiati nella nuova organizzazione.',
      },
      blocks: {
        title: 'Blocchi di processo',
        description: 'Tutti i blocchi di processo e le loro connessioni verranno copiati.',
      },
      safety: {
        title: 'Sicurezza',
        description: 'In caso di errore, tutte le modifiche vengono annullate automaticamente.',
      },
    },
  },
  cloneTaskList: {
    button: 'Clona elenchi',
    title: 'Clona elenchi',
    processing: 'Clonazione degli elenchi... Attendere prego!',
    switchToTarget: "Passa all'organizzazione di destinazione",
    selectTaskLists: 'Seleziona gli elenchi da clonare',
    selected: 'selezionato/i',
    targetOrganisation: 'Organizzazione di destinazione',
    cloning: 'Clonazione...',
    clone: 'Clona elenchi',
    success: '✅ Tutti gli elenchi clonati con successo',
    items: 'elementi',
    files: 'file',
    successMessage:
      "Gli elenchi sono stati clonati con successo nell'organizzazione di destinazione.",
    error: '❌ Operazione di clonazione fallita',
    errorMessage: 'Si prega di controllare gli errori sopra e riprovare.',
    partial: '⚠️ Successo parziale',
    succeeded: 'riuscito/i',
    failed: 'fallito/i',
    successfulClones: '✅ Cloni riusciti',
    failedClones: '❌ Cloni falliti',
    info: {
      title: 'Cosa verrà clonato?',
      language: {
        title: 'Lingua',
        description:
          "Solo il contenuto nella tua lingua attuale verrà copiato nell'organizzazione di destinazione.",
      },
      files: {
        title: 'File e documenti',
        description:
          "Tutti i file allegati agli elementi dell'attività verranno copiati. Ogni file viene copiato una sola volta, anche se utilizzato in più posizioni.",
      },
      items: {
        title: "Elementi dell'attività",
        description:
          "Tutti gli elementi dell'attività negli elenchi selezionati verranno copiati, preservando il loro ordine e la loro struttura.",
      },
      safety: {
        title: 'Sicurezza',
        description:
          'Questa operazione è sicura. In caso di errore, tutte le modifiche vengono automaticamente annullate per evitare copie incomplete.',
      },
    },
  },
  general: {
    selectAll: 'Seleziona tutto',
    cancel: 'Annulla',
    close: 'Chiudi',
    switching: 'Cambiando...',
  },
  cloning: {
    loadingMessage: 'Attendere mentre elaboriamo i vostri dati...',
    systemErrors: 'Errori di sistema:',
    missingFilesCount: 'File mancanti ({{count}}):',
    andMoreItems: '... e {{count}} altri',
    failed: 'Fallito',
  },
}
