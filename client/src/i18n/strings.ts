export type Lang = "fr" | "en";

/** Temporary minimal strings — pull full file if analytics labels missing. */
export const strings = {
  fr: {
    appTitle: "HIS-SRE · Orientation",
    appSubtitle: "Aide à l’orientation",
    disclaimer: "Outil d’aide à la décision.",
    loadingConfig: "Chargement…",
    configError: "Impossible de charger la configuration.",
    retry: "Réessayer",
    navWizard: "Orientation",
    navAnalytics: "Analytique",
    themeLight: "Clair",
    themeDark: "Sombre",
    themeSystem: "Système",
    language: "Langue",
    continue: "Continuer",
    back: "Retour",
    calculate: "Calculer",
    calculating: "Calcul…",
    results: "Résultats",
    newEvaluation: "Nouvelle évaluation",
    adminTokenPrompt: "Jeton ADMIN_TOKEN :",
    adminTokenInvalid: "Jeton trop court.",
    adminTokenRejected: "Jeton refusé.",
    deleteProfile: "Supprimer",
    deleteConfirm: "Supprimer « {name} » ?",
    deleteError: "Échec de la suppression.",
    deleting: "Suppression…",
    matchSTRONG_MATCH: "Forte correspondance",
    matchSTRONG_MATCH_CONVERSATION: "Forte correspondance — à discuter",
    matchPOSSIBLE_FIT: "Correspondance possible",
    matchPROFILE_DEVELOPING: "Profil en construction",
    matchWEAK_MATCH: "Faible correspondance",
  },
  en: {
    appTitle: "HIS-SRE · Orientation",
    appSubtitle: "Decision support",
    disclaimer: "Decision-support tool only.",
    loadingConfig: "Loading…",
    configError: "Could not load configuration.",
    retry: "Retry",
    navWizard: "Orientation",
    navAnalytics: "Analytics",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Language",
    continue: "Continue",
    back: "Back",
    calculate: "Calculate",
    calculating: "Calculating…",
    results: "Results",
    newEvaluation: "New evaluation",
    adminTokenPrompt: "ADMIN_TOKEN:",
    adminTokenInvalid: "Token too short.",
    adminTokenRejected: "Token rejected.",
    deleteProfile: "Delete",
    deleteConfirm: "Delete « {name} »?",
    deleteError: "Delete failed.",
    deleting: "Deleting…",
    matchSTRONG_MATCH: "Strong match",
    matchSTRONG_MATCH_CONVERSATION: "Strong match — conversation",
    matchPOSSIBLE_FIT: "Possible fit",
    matchPROFILE_DEVELOPING: "Profile developing",
    matchWEAK_MATCH: "Weak match",
  },
} as const;

export type StringKey = keyof (typeof strings)["fr"];

export const STREAM_LABELS_I18N: Record<Lang, Record<string, string>> = {
  fr: {
    MATHEMATICS: "Mathématiques",
    EXPERIMENTAL_SCIENCES: "Sciences expérimentales",
    TECHNICAL_MATHEMATICS: "Mathématiques techniques",
    MANAGEMENT_ECONOMY: "Gestion et économie",
    FOREIGN_LANGUAGES: "Langues étrangères",
    LITERATURE_PHILOSOPHY: "Lettres et philosophie",
  },
  en: {
    MATHEMATICS: "Mathematics",
    EXPERIMENTAL_SCIENCES: "Experimental Sciences",
    TECHNICAL_MATHEMATICS: "Technical Mathematics",
    MANAGEMENT_ECONOMY: "Management & Economy",
    FOREIGN_LANGUAGES: "Foreign Languages",
    LITERATURE_PHILOSOPHY: "Literature & Philosophy",
  },
};

export const SUBJECT_LABELS_I18N: Record<Lang, Record<string, string>> = {
  fr: {
    MATH: "Mathématiques",
    PHYSICS: "Physique",
    NATURAL_SCIENCES: "Sciences naturelles",
    PHILOSOPHY: "Philosophie",
    ARABIC: "Arabe",
    FRENCH: "Français",
    ENGLISH: "Anglais",
    ACCOUNTING_FINANCE: "Comptabilité & finance",
    ECONOMICS: "Économie",
    HISTORY_GEOGRAPHY: "Histoire-géographie",
  },
  en: {
    MATH: "Mathematics",
    PHYSICS: "Physics",
    NATURAL_SCIENCES: "Natural Sciences",
    PHILOSOPHY: "Philosophy",
    ARABIC: "Arabic",
    FRENCH: "French",
    ENGLISH: "English",
    ACCOUNTING_FINANCE: "Accounting & Finance",
    ECONOMICS: "Economics",
    HISTORY_GEOGRAPHY: "History & Geography",
  },
};

export function matchLabelText(lang: Lang, code: string): string {
  const key = `match${code}` as StringKey;
  return (strings[lang] as Record<string, string>)[key] ?? code;
}
