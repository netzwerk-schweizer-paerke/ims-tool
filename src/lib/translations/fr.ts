export const fr = {
  admin: {
    links: {
      dashboard: 'Tableau de bord',
      activityLandscape: "Paysage d'activités",
      title: 'Liens',
    },
    selectOrganisations: {
      title: "Choisir l'organisation active",
      orgLanguageMismatch:
        "Veuillez noter que vous modifiez actuellement du contenu qui n'est pas dans la langue de l'organisation.",
      noOrganisations:
        'Aucune organisation ne vous a été attribuée. Veuillez contacter un administrateur.',
      reset: 'Rétablir la langue par défaut',
    },
  },
  activityLandscape: {
    title: "Paysage d'activités",
    blockHasNoName: "Le bloc n'a pas de nom",
    noBlocks: 'Aucun bloc',
    noContent: "Aucune activité ou processus défini. Créez-en d'abord.",
  },
  activityBlock: {
    title: "Bloc d'activités",
    input: {
      title: 'Entrée',
    },
    tasks: {
      title: 'Tâches',
      noTasks: 'Aucune tâche définie',
    },
    output: {
      title: 'Sortie',
    },
    flows: {
      title: 'Flux',
      noFlows: 'Aucun flux de processus défini',
    },
    infos: {
      norms: 'Normes',
      support: 'Support',
    },
  },
  flowBlock: {
    title: 'Flux',
    table: {
      keypoints: 'Points clés',
      tools: 'Outils',
      responsibility: 'Responsabilité',
    },
  },
  listBlock: {
    title: 'Liste',
    table: {
      keypoints: 'Points clés',
      tools: 'Outils',
      responsibility: 'Responsabilité',
    },
  },
  common: {
    back: 'Retour',
    edit: 'Modifier',
    delete: 'Supprimer',
    noContentDefined: 'Aucun contenu défini',
    continue: 'Continuer',
    lastUpdated: 'Dernière mise à jour',
    boolean: {
      true: 'Vrai',
      false: 'Faux',
    },
  },
  cloneActivity: {
    button: 'Cloner les activités',
    title: 'Cloner une activité',
    processing: 'Clonage des activités en cours... Veuillez patienter !',
    switchToTarget: "Basculer vers l'organisation cible",
    cloning: 'Clonage...',
    clone: 'Cloner les activités',
    info: {
      title: 'Que sera-t-il cloné ?',
      language: {
        title: 'Langue',
        description:
          'Seul le contenu dans votre langue actuelle (par ex. français en affichage FR) sera copié.',
      },
      files: {
        title: 'Fichiers et documents',
        description:
          "Tous les fichiers joints seront copiés dans la nouvelle organisation. Chaque fichier n'est copié qu'une seule fois, même s'il est utilisé plusieurs fois.",
      },
      missingFiles: {
        title: 'Fichiers manquants',
        description:
          "Si un fichier ne peut pas être trouvé, l'activité sera quand même clonée mais sans ce fichier. Vous recevrez un rapport des fichiers manquants.",
      },
      tasks: {
        title: 'Tâches',
        description:
          "Tous les flux de tâches et listes de tâches connectés seront copiés avec l'activité.",
      },
      sharedResources: {
        title: 'Ressources partagées',
        description:
          'Les documents publics restent liés mais ne sont pas copiés (ils sont déjà disponibles pour toutes les organisations).',
      },
      safety: {
        title: 'Sécurité',
        description:
          'Si quelque chose se passe mal, tous les changements sont automatiquement annulés pour éviter les copies incomplètes.',
      },
    },
    form: {
      instructions:
        "Sélectionnez les activités que vous souhaitez cloner et l'organisation cible ci-dessous.",
      activities: 'Activités',
      targetOrganisation: "Sélectionner l'organisation cible",
    },
    status: {
      allFailed: 'Toutes les activités ont échoué au clonage',
      allSuccess: 'Toutes les activités ont été clonées avec succès !',
      withWarnings: 'Activités clonées avec des avertissements',
      withWarningsDescription:
        'Certaines activités ont été clonées avec succès mais avec des fichiers manquants ou des données partielles.',
      partialSuccess: 'Succès partiel : {{succeeded}} réussi, {{failed}} échoué',
      successfullyCloned: 'Cloné avec succès :',
      failedToClone: 'Échec du clonage :',
      withIssues: 'Cloné avec des problèmes',
    },
    results: {
      summary: 'Résumé :',
      completeness: 'Complétude :',
      sourceActivity: 'Activité source :',
      variant: 'Variante :',
      activityComparison: "Comparaison d'activité :",
      completenessAnalysis: 'Analyse de complétude :',
      fieldsPreserved: 'Champs préservés :',
      fieldsModified: 'Champs modifiés :',
      fieldsRemoved: 'Champs supprimés :',
      missingDocuments: 'Fichiers de documents manquants :',
      failedTasks: 'Tâches échouées :',
      file: 'Fichier :',
      usageInformation: "Informations d'utilisation :",
      error: 'Erreur :',
      failedTask: 'Tâche échouée :',
      detailedResults: 'Résultats détaillés',
      complete: 'Terminé',
    },
    table: {
      metric: 'Métrique',
      source: 'Source',
      clone: 'Clone',
      status: 'Statut',
      activityId: "ID d'activité",
      name: 'Nom',
      hasDescription: 'A une description',
      variant: 'Variante',
      blocksCount: 'Nombre de blocs',
      directFileAttachments: 'Pièces jointes directes',
      richTextDocuments: 'Fichiers de documents texte enrichi',
      publicDocuments: 'Fichiers de documents publics',
      totalDocumentUsages: 'Utilisations totales de fichiers de documents',
      uniqueDocuments: 'Fichiers de documents uniques',
      totalTasks: 'Tâches totales',
      taskFlows: 'Flux de tâches',
      taskLists: 'Listes de tâches',
      taskFlowBlocks: 'Blocs de flux de tâches',
      taskListBlocks: 'Blocs de listes de tâches',
      completeness: 'Complétude',
      relatedEntities: 'Entités liées',
      missingFiles: 'Fichiers manquants',
      totalActivities: 'Total activités:',
      totalRelatedEntities: 'Total entités liées:',
      totalDocumentFiles: 'Total fichiers documents:',
      totalMissingFiles: 'Fichiers manquants:',
    },
  },
  cloneTaskFlow: {
    button: 'Cloner les processus',
    title: 'Cloner les processus',
    processing: 'Clonage des processus... Veuillez patienter !',
    switchToTarget: "Basculer vers l'organisation cible",
    selectTaskFlows: 'Sélectionner les processus à cloner',
    selected: 'sélectionné(s)',
    targetOrganisation: 'Organisation cible',
    cloning: 'Clonage...',
    clone: 'Cloner les processus',
    success: '✅ Tous les processus clonés avec succès',
    blocks: 'blocs',
    files: 'fichiers',
    successMessage: "Les processus ont été clonés avec succès dans l'organisation cible.",
    error: "❌ Échec de l'opération de clonage",
    errorMessage: 'Veuillez vérifier les erreurs ci-dessus et réessayer.',
    partial: '⚠️ Succès partiel',
    succeeded: 'réussi(s)',
    failed: 'échoué(s)',
    successfulClones: '✅ Clones réussis',
    failedClones: '❌ Clones échoués',
    status: {
      allSuccess: 'Tous les processus clonés avec succès !',
    },
    results: {
      summary: 'Résumé :',
      completeness: 'Complétude :',
      sourceItem: 'Processus source :',
      comparison: 'Comparaison des processus :',
    },
    table: {
      metric: 'Métrique',
      source: 'Source',
      clone: 'Clone',
      itemId: 'ID du processus',
      blocksCount: 'Nombre de blocs',
      itemsCount: "Nombre d'éléments",
      directFileAttachments: 'Pièces jointes directes',
      richTextDocuments: 'Fichiers de documents texte enrichi',
      publicDocuments: 'Fichiers de documents publics',
      totalDocumentUsages: 'Utilisations totales de fichiers de documents',
      uniqueDocuments: 'Fichiers de documents uniques',
    },
    info: {
      title: "Qu'est-ce qui sera cloné ?",
      language: {
        title: 'Langue',
        description: 'Seul le contenu dans votre langue actuelle sera copié.',
      },
      files: {
        title: 'Fichiers et documents',
        description: 'Tous les fichiers joints seront copiés dans la nouvelle organisation.',
      },
      blocks: {
        title: 'Blocs de processus',
        description: 'Tous les blocs de processus et leurs connexions seront copiés.',
      },
      safety: {
        title: 'Sécurité',
        description: "En cas d'erreur, toutes les modifications sont automatiquement annulées.",
      },
    },
  },
  cloneTaskList: {
    button: 'Cloner les listes',
    title: 'Cloner les listes',
    processing: 'Clonage des listes... Veuillez patienter !',
    switchToTarget: "Basculer vers l'organisation cible",
    selectTaskLists: 'Sélectionner les listes à cloner',
    selected: 'sélectionné(s)',
    targetOrganisation: 'Organisation cible',
    cloning: 'Clonage...',
    clone: 'Cloner les listes',
    success: '✅ Toutes les listes clonées avec succès',
    items: 'éléments',
    files: 'fichiers',
    successMessage: "Les listes ont été clonées avec succès dans l'organisation cible.",
    error: "❌ Échec de l'opération de clonage",
    errorMessage: 'Veuillez vérifier les erreurs ci-dessus et réessayer.',
    partial: '⚠️ Succès partiel',
    succeeded: 'réussi(s)',
    failed: 'échoué(s)',
    successfulClones: '✅ Clones réussis',
    failedClones: '❌ Clones échoués',
    info: {
      title: 'Que sera-t-il cloné ?',
      language: {
        title: 'Langue',
        description:
          "Seul le contenu dans votre langue actuelle sera copié vers l'organisation cible.",
      },
      files: {
        title: 'Fichiers et documents',
        description:
          "Tous les fichiers joints aux éléments de tâche seront copiés. Chaque fichier n'est copié qu'une fois, même s'il est utilisé à plusieurs endroits.",
      },
      items: {
        title: 'Éléments de tâche',
        description:
          'Tous les éléments de tâche dans les listes sélectionnées seront copiés, en préservant leur ordre et leur structure.',
      },
      safety: {
        title: 'Sécurité',
        description:
          "Cette opération est sûre. En cas d'erreur, toutes les modifications sont automatiquement annulées pour éviter les copies incomplètes.",
      },
    },
  },
  general: {
    selectAll: 'Tout sélectionner',
    cancel: 'Annuler',
    close: 'Fermer',
    switching: 'Changement...',
  },
  cloning: {
    loadingMessage: 'Veuillez patienter pendant que nous traitons vos données...',
    systemErrors: 'Erreurs système :',
    missingFilesCount: 'Fichiers manquants ({{count}}) :',
    andMoreItems: '... et {{count}} de plus',
    failed: 'Échec',
  },
}
