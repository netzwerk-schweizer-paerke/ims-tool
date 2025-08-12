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
    },
    table: {
      metric: 'Métrique',
      source: 'Source',
      clone: 'Clone',
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
    },
  },
}
