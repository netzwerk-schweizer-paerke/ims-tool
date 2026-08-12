export const fr = {
  activityBlock: {
    flows: {
      noFlows: 'Aucun flux de processus défini',
      title: 'Flux',
    },
    infos: {
      norms: 'Normes',
      support: 'Support',
    },
    input: {
      title: 'Entrée',
    },
    output: {
      title: 'Sortie',
    },
    tasks: {
      noTasks: 'Aucune tâche définie',
      title: 'Tâches',
    },
    title: "Bloc d'activités",
  },
  activityLandscape: {
    blockHasNoName: "Le bloc n'a pas de nom",
    noBlocks: 'Aucun bloc',
    noContent: "Aucune activité ou processus défini. Créez-en d'abord.",
    title: "Paysage d'activités",
  },
  admin: {
    links: {
      activityLandscape: "Paysage d'activités",
      dashboard: 'Tableau de bord',
      title: 'Liens',
    },
    selectOrganisations: {
      noOrganisations:
        'Aucune organisation ne vous a été attribuée. Veuillez contacter un administrateur.',
      orgLanguageMismatch:
        "Veuillez noter que vous modifiez actuellement du contenu qui n'est pas dans la langue de l'organisation.",
      reset: 'Rétablir la langue par défaut',
      title: "Choisir l'organisation active",
    },
  },
  cloneActivity: {
    button: 'Cloner les activités',
    clone: 'Cloner les activités',
    cloning: 'Clonage...',
    form: {
      activities: 'Activités',
      instructions:
        "Sélectionnez les activités que vous souhaitez cloner et l'organisation cible ci-dessous.",
      targetOrganisation: "Sélectionner l'organisation cible",
    },
    info: {
      files: {
        description:
          "Tous les fichiers joints seront copiés dans la nouvelle organisation. Chaque fichier n'est copié qu'une seule fois, même s'il est utilisé plusieurs fois.",
        title: 'Fichiers et documents',
      },
      language: {
        description:
          'Seul le contenu dans votre langue actuelle (par ex. français en affichage FR) sera copié.',
        title: 'Langue',
      },
      missingFiles: {
        description:
          "Si un fichier ne peut pas être trouvé, l'activité sera quand même clonée mais sans ce fichier. Vous recevrez un rapport des fichiers manquants.",
        title: 'Fichiers manquants',
      },
      safety: {
        description:
          'Si quelque chose se passe mal, tous les changements sont automatiquement annulés pour éviter les copies incomplètes.',
        title: 'Sécurité',
      },
      sharedResources: {
        description:
          'Les documents publics restent liés mais ne sont pas copiés (ils sont déjà disponibles pour toutes les organisations).',
        title: 'Ressources partagées',
      },
      tasks: {
        description:
          "Tous les flux de tâches et listes de tâches connectés seront copiés avec l'activité.",
        title: 'Tâches',
      },
      title: 'Que sera-t-il cloné ?',
    },
    processing: 'Clonage des activités en cours... Veuillez patienter !',
    results: {
      activityComparison: "Comparaison d'activité :",
      complete: 'Terminé',
      completeness: 'Complétude :',
      completenessAnalysis: 'Analyse de complétude :',
      detailedResults: 'Résultats détaillés',
      error: 'Erreur :',
      failedTask: 'Tâche échouée :',
      failedTasks: 'Tâches échouées :',
      fieldsModified: 'Champs modifiés :',
      fieldsPreserved: 'Champs préservés :',
      fieldsRemoved: 'Champs supprimés :',
      file: 'Fichier :',
      missingDocuments: 'Fichiers de documents manquants :',
      sourceActivity: 'Activité source :',
      summary: 'Résumé :',
      usageInformation: "Informations d'utilisation :",
      variant: 'Variante :',
    },
    status: {
      allFailed: 'Toutes les activités ont échoué au clonage',
      allSuccess: 'Toutes les activités ont été clonées avec succès !',
      failedToClone: 'Échec du clonage :',
      partialSuccess: 'Succès partiel : {{succeeded}} réussi, {{failed}} échoué',
      successfullyCloned: 'Cloné avec succès :',
      withIssues: 'Cloné avec des problèmes',
      withWarnings: 'Activités clonées avec des avertissements',
      withWarningsDescription:
        'Certaines activités ont été clonées avec succès mais avec des fichiers manquants ou des données partielles.',
    },
    switchToTarget: "Basculer vers l'organisation cible",
    table: {
      activityId: "ID d'activité",
      blocksCount: 'Nombre de blocs',
      clone: 'Clone',
      completeness: 'Complétude',
      directFileAttachments: 'Pièces jointes directes',
      hasDescription: 'A une description',
      metric: 'Métrique',
      missingFiles: 'Fichiers manquants',
      name: 'Nom',
      publicDocuments: 'Fichiers de documents publics',
      relatedEntities: 'Entités liées',
      richTextDocuments: 'Fichiers de documents texte enrichi',
      source: 'Source',
      status: 'Statut',
      taskFlowBlocks: 'Blocs de flux de tâches',
      taskFlows: 'Flux de tâches',
      taskListBlocks: 'Blocs de listes de tâches',
      taskLists: 'Listes de tâches',
      totalActivities: 'Total activités:',
      totalDocumentFiles: 'Total fichiers documents:',
      totalDocumentUsages: 'Utilisations totales de fichiers de documents',
      totalMissingFiles: 'Fichiers manquants:',
      totalRelatedEntities: 'Total entités liées:',
      totalTasks: 'Tâches totales',
      uniqueDocuments: 'Fichiers de documents uniques',
      variant: 'Variante',
    },
    title: 'Cloner une activité',
  },
  cloneTaskFlow: {
    blocks: 'blocs',
    button: 'Cloner les processus',
    clone: 'Cloner les processus',
    cloning: 'Clonage...',
    error: "❌ Échec de l'opération de clonage",
    errorMessage: 'Veuillez vérifier les erreurs ci-dessus et réessayer.',
    failed: 'échoué(s)',
    failedClones: '❌ Clones échoués',
    files: 'fichiers',
    info: {
      blocks: {
        description: 'Tous les blocs de processus et leurs connexions seront copiés.',
        title: 'Blocs de processus',
      },
      files: {
        description: 'Tous les fichiers joints seront copiés dans la nouvelle organisation.',
        title: 'Fichiers et documents',
      },
      language: {
        description: 'Seul le contenu dans votre langue actuelle sera copié.',
        title: 'Langue',
      },
      safety: {
        description: "En cas d'erreur, toutes les modifications sont automatiquement annulées.",
        title: 'Sécurité',
      },
      title: "Qu'est-ce qui sera cloné ?",
    },
    partial: '⚠️ Succès partiel',
    processing: 'Clonage des processus... Veuillez patienter !',
    results: {
      comparison: 'Comparaison des processus :',
      completeness: 'Complétude :',
      sourceItem: 'Processus source :',
      summary: 'Résumé :',
    },
    selected: 'sélectionné(s)',
    selectTaskFlows: 'Sélectionner les processus à cloner',
    status: {
      allSuccess: 'Tous les processus clonés avec succès !',
    },
    succeeded: 'réussi(s)',
    success: '✅ Tous les processus clonés avec succès',
    successfulClones: '✅ Clones réussis',
    successMessage: "Les processus ont été clonés avec succès dans l'organisation cible.",
    switchToTarget: "Basculer vers l'organisation cible",
    table: {
      blocksCount: 'Nombre de blocs',
      clone: 'Clone',
      directFileAttachments: 'Pièces jointes directes',
      itemId: 'ID du processus',
      itemsCount: "Nombre d'éléments",
      metric: 'Métrique',
      publicDocuments: 'Fichiers de documents publics',
      richTextDocuments: 'Fichiers de documents texte enrichi',
      source: 'Source',
      totalDocumentUsages: 'Utilisations totales de fichiers de documents',
      uniqueDocuments: 'Fichiers de documents uniques',
    },
    targetOrganisation: 'Organisation cible',
    title: 'Cloner les processus',
  },
  cloneTaskList: {
    button: 'Cloner les listes',
    clone: 'Cloner les listes',
    cloning: 'Clonage...',
    error: "❌ Échec de l'opération de clonage",
    errorMessage: 'Veuillez vérifier les erreurs ci-dessus et réessayer.',
    failed: 'échoué(s)',
    failedClones: '❌ Clones échoués',
    files: 'fichiers',
    info: {
      files: {
        description:
          "Tous les fichiers joints aux éléments de tâche seront copiés. Chaque fichier n'est copié qu'une fois, même s'il est utilisé à plusieurs endroits.",
        title: 'Fichiers et documents',
      },
      items: {
        description:
          'Tous les éléments de tâche dans les listes sélectionnées seront copiés, en préservant leur ordre et leur structure.',
        title: 'Éléments de tâche',
      },
      language: {
        description:
          "Seul le contenu dans votre langue actuelle sera copié vers l'organisation cible.",
        title: 'Langue',
      },
      safety: {
        description:
          "Cette opération est sûre. En cas d'erreur, toutes les modifications sont automatiquement annulées pour éviter les copies incomplètes.",
        title: 'Sécurité',
      },
      title: 'Que sera-t-il cloné ?',
    },
    items: 'éléments',
    partial: '⚠️ Succès partiel',
    processing: 'Clonage des listes... Veuillez patienter !',
    selected: 'sélectionné(s)',
    selectTaskLists: 'Sélectionner les listes à cloner',
    succeeded: 'réussi(s)',
    success: '✅ Toutes les listes clonées avec succès',
    successfulClones: '✅ Clones réussis',
    successMessage: "Les listes ont été clonées avec succès dans l'organisation cible.",
    switchToTarget: "Basculer vers l'organisation cible",
    targetOrganisation: 'Organisation cible',
    title: 'Cloner les listes',
  },
  cloning: {
    andMoreItems: '... et {{count}} de plus',
    failed: 'Échec',
    loadingMessage: 'Veuillez patienter pendant que nous traitons vos données...',
    missingFilesCount: 'Fichiers manquants ({{count}}) :',
    systemErrors: 'Erreurs système :',
  },
  common: {
    back: 'Retour',
    boolean: {
      false: 'Faux',
      true: 'Vrai',
    },
    continue: 'Continuer',
    delete: 'Supprimer',
    edit: 'Modifier',
    enableBlock: 'Activer le bloc',
    lastUpdated: 'Dernière mise à jour',
    noContentDefined: 'Aucun contenu défini',
  },
  dataHealth: {
    blocking: 'Bloquant',
    blockingHint: 'Le clonage s’interrompt avec une erreur sur ces points.',
    blockNumber: 'Bloc {{number}}',
    button: 'Vérifier les données',
    checkExternalUrls: 'Vérifier les liens externes',
    checkExternalUrlsHint:
      'Interroge chaque lien externe une fois. Un peu plus long et envoie des requêtes à des serveurs tiers.',
    checking: 'Vérification en cours...',
    checkThisItem: 'Vérifier cet élément',
    counts:
      'Vérifié : {{activities}} groupes de processus, {{taskFlows}} processus, {{taskLists}} listes, {{documents}} documents',
    degrading: 'Dégradant',
    degradingHint:
      'Le clonage réussit, mais la copie arrive incomplète — généralement sans le fichier concerné.',
    field: {
      description: 'Description',
      document: 'Document',
      files: 'Fichiers',
      infos: 'Informations',
      io: 'Entrée / Sortie',
      keypoints: 'Points clés',
      relations: 'Tâches liées',
      responsibility: 'Responsabilité',
      tools: 'Outils',
    },
    fileNumber: 'Fichier {{number}}',
    finding: {
      crossOrgReference:
        'Référence {{collection}} {{id}} de l’organisation {{owner}} et non {{organisation}}. Le contenu d’un autre parc est lié ici, et une copie continue de pointer dessus.',
      crossOrgReferenceFollowed:
        'Référence {{collection}} {{id}} de l’organisation {{owner}} et non {{organisation}}. Le clonage le lit avec les droits de l’appelant et s’interrompt donc avec une erreur 404.',
      danglingReference:
        'Référence {{collection}} {{id}}, qui n’existe pas. Le clonage ne suit pas ce lien, la copie hérite donc d’une référence morte.',
      danglingReferenceFollowed:
        'Référence {{collection}} {{id}}, qui n’existe pas. Le clonage suit cette référence et s’interrompt avec une erreur 404.',
      documentIncomplete:
        'Manquant : {{fields}}. Le clonage signale ce fichier comme manquant et copie l’activité sans lui.',
      externalUrlMalformed: 'Lien sans cible valide : « {{url}} »',
      externalUrlNotFound: 'Le lien externe répond avec HTTP {{status}} : {{url}}',
      externalUrlUnreachable: 'Lien externe injoignable ({{reason}}) : {{url}}',
      malformedRichTextNoChildren:
        'Champ de texte enrichi : « root » ne contient pas de tableau « children ».',
      malformedRichTextRoot: 'Champ de texte enrichi : « root » n’est pas un objet.',
      missingRequiredField:
        'Le champ obligatoire « {{field}} » est vide dans la langue par défaut ({{locale}}). Le clonage échoue à la validation.',
      prefixOrganisationMismatch:
        'Stocké sous « {{prefix}} », attendu « {{expected}} ». Le fichier reste accessible, mais l’organisation S3 ne correspond plus au parc.',
      s3ObjectMissing:
        'Aucun objet sous « {{key}} ». L’enregistrement existe mais le fichier a disparu — les copies arrivent sans lui.',
      s3ObjectUnreadable: 'Impossible de lire « {{key}} » : {{error}}',
    },
    healthy: 'Aucun problème détecté. Les données de ce parc sont entièrement clonables.',
    healthyDocument: 'Aucun problème détecté dans cet élément.',
    itemNumber: 'Entrée {{number}}',
    jumpToBlock: 'Aller au bloc',
    noFindings: 'Aucun résultat',
    openRelated: 'Élément référencé',
    openSource: 'Ouvrir',
    precondition: {
      apiKeyInvalid:
        'PAYLOAD_API_KEY n’authentifie pas — /api/users/me ne renvoie aucun utilisateur. Chaque téléchargement de fichier lors du clonage échoue et chaque activité est copiée sans ses pièces jointes. Les clés sont chiffrées avec PAYLOAD_SECRET ; un secret modifié les invalide.',
      apiKeyMissing: 'PAYLOAD_API_KEY n’est pas défini.',
      apiKeyUnreachable: 'Le serveur n’a pas pu être contacté pour vérifier la clé.',
      s3BucketMissing: 'S3_BUCKET n’est pas défini.',
      s3Unreachable:
        'S3 est inaccessible ou mal configuré. Les vérifications de fichiers ont été ignorées.',
    },
    preconditionFailed: 'Condition préalable non remplie',
    preconditionHint:
      'Ces vérifications concernent l’ensemble de l’installation, pas un parc en particulier.',
    run: 'Lancer la vérification',
    shared: 'Ressources partagées',
    sharedHint:
      'Les documents publics appartiennent à tous les parcs. Ils ne sont délibérément pas clonés — les copies continuent de pointer vers l’original. Ces résultats concernent donc tous les parcs, pas seulement celui-ci.',
    title: 'Contrôle des données',
    titleDocument: 'Contrôle de cet élément',
  },
  flowBlock: {
    table: {
      keypoints: 'Points clés',
      responsibility: 'Responsabilité',
      tools: 'Outils',
    },
    title: 'Flux',
  },
  general: {
    cancel: 'Annuler',
    close: 'Fermer',
    selectAll: 'Tout sélectionner',
    switching: 'Changement...',
  },
  listBlock: {
    table: {
      keypoints: 'Points clés',
      responsibility: 'Responsabilité',
      tools: 'Outils',
    },
    title: 'Liste',
  },
}
