export type Lang = "fr" | "en";

export const strings = {
  fr: {
    appTitle: "HIS-SRE · Orientation",
    appSubtitle: "Aide à l'orientation — profil BAC + RIASEC vers les licences HIS",
    disclaimer:
      "Outil d'aide à la décision. Les scores sont indicatifs et ne remplacent pas le conseil d'orientation.",
    loadingConfig: "Chargement de la configuration…",
    configError: "Impossible de charger la configuration.",
    retry: "Réessayer",
    navWizard: "Orientation",
    navAnalytics: "Statistiques",
    stepAcademic: "Académique",
    stepRiasec: "RIASEC",
    stepResults: "Résultats",
    stepOf: "Étape {n} sur 3",
    academicTitle: "Profil académique",
    academicHelp:
      "Indiquez la filière, la moyenne générale et les quatre notes fixes (2 modules principaux, 1 hors filière, anglais).",
    fullName: "Nom complet",
    preferredSpecialty: "Spécialité préférée (HIS)",
    selectPreferredSpecialty: "Choisir une spécialité…",
    preferredSpecialtyHelp:
      "Choix obligatoire. Préférence : 100 pour la spécialité choisie, 50 pour les autres (5 % du score final).",
    errPreferredSpecialty: "Sélectionnez votre spécialité HIS préférée.",
    fullNamePlaceholder: "Nom et prénom de l'élève",
    bacStream: "Filière du BAC",
    selectStream: "Choisir une filière…",
    genieOption: "Option Mathématiques techniques (génie)",
    selectGenie: "Choisir un génie…",
    overallMark: "Moyenne générale BAC (/20)",
    gradesHeading: "Notes par module",
    slotMain1: "Module principal 1",
    slotMain2: "Module principal 2",
    slotOpposite: "Module hors filière",
    slotEnglish: "Anglais",
    next: "Suivant",
    back: "Retour",
    calculate: "Calculer les recommandations",
    calculating: "Calcul en cours…",
    formErrors: "Corrigez les champs indiqués.",
    errName: "Le nom doit contenir au moins 2 caractères.",
    errStream: "Sélectionnez une filière.",
    errGenie: "Sélectionnez une option génie.",
    errOverall: "Moyenne invalide (0–20).",
    streamChangeConfirm: "Changer de filière efface les notes saisies. Continuer ?",
    riasecTitle: "Profil RIASEC",
    riasecHelp: "Indiquez vos 3 lettres dominantes avec un poids relatif (1–100).",
    errRiasecSlot: "Sélectionnez une lettre RIASEC.",
    errRiasecWeight: "Poids invalide (1–100).",
    errRiasecDup: "Les trois lettres doivent être distinctes.",
    preference: "Préférence",
    academic: "Académique",
    riasec: "RIASEC",
    technical: "Technique",
    weightsLine: "Pondération du score",
    resultsTitle: "Résultats",
    newSession: "Nouvelle session",
    analyticsTitle: "Tableau de bord",
  },
  en: {
    appTitle: "HIS-SRE · Orientation",
    appSubtitle: "Orientation support — BAC + RIASEC toward HIS licences",
    disclaimer:
      "Decision-support tool. Scores are indicative and do not replace counseling.",
    loadingConfig: "Loading configuration…",
    configError: "Could not load configuration.",
    retry: "Retry",
    navWizard: "Orientation",
    navAnalytics: "Statistics",
    stepAcademic: "Academic",
    stepRiasec: "RIASEC",
    stepResults: "Results",
    stepOf: "Step {n} of 3",
    academicTitle: "Academic profile",
    academicHelp:
      "Enter stream, overall mark, and the four fixed grades (2 main modules, 1 opposite, English).",
    fullName: "Full name",
    preferredSpecialty: "Preferred specialty (HIS)",
    selectPreferredSpecialty: "Select a specialty…",
    preferredSpecialtyHelp:
      "Required. Preference: 100 for the chosen specialty, 50 for the others (5% of final score).",
    errPreferredSpecialty: "Select your preferred HIS specialty.",
    fullNamePlaceholder: "Student full name",
    bacStream: "BAC stream",
    selectStream: "Select a stream…",
    genieOption: "Technical mathematics génie option",
    selectGenie: "Select a génie…",
    overallMark: "Overall BAC mark (/20)",
    gradesHeading: "Module grades",
    slotMain1: "Main module 1",
    slotMain2: "Main module 2",
    slotOpposite: "Opposite-stream module",
    slotEnglish: "English",
    next: "Next",
    back: "Back",
    calculate: "Calculate recommendations",
    calculating: "Calculating…",
    formErrors: "Please fix the highlighted fields.",
    errName: "Name must be at least 2 characters.",
    errStream: "Select a stream.",
    errGenie: "Select a génie option.",
    errOverall: "Invalid overall mark (0–20).",
    streamChangeConfirm: "Changing stream clears entered grades. Continue?",
    riasecTitle: "RIASEC profile",
    riasecHelp: "Enter your top 3 letters with relative weights (1–100).",
    errRiasecSlot: "Select a RIASEC letter.",
    errRiasecWeight: "Invalid weight (1–100).",
    errRiasecDup: "The three letters must be distinct.",
    preference: "Preference",
    academic: "Academic",
    riasec: "RIASEC",
    technical: "Technical",
    weightsLine: "Score weights",
    resultsTitle: "Results",
    newSession: "New session",
    analyticsTitle: "Dashboard",
  },
} as const;

export type StringKey = keyof typeof strings.fr;

export const STREAM_LABELS_I18N: Record<
  Lang,
  Record<
    | "MATHEMATICS"
    | "EXPERIMENTAL_SCIENCES"
    | "TECHNICAL_MATHEMATICS"
    | "MANAGEMENT_ECONOMY"
    | "FOREIGN_LANGUAGES"
    | "LITERATURE_PHILOSOPHY",
    string
  >
> = {
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
    EXPERIMENTAL_SCIENCES: "Experimental sciences",
    TECHNICAL_MATHEMATICS: "Technical mathematics",
    MANAGEMENT_ECONOMY: "Management & economics",
    FOREIGN_LANGUAGES: "Foreign languages",
    LITERATURE_PHILOSOPHY: "Literature & philosophy",
  },
};

export const SUBJECT_LABELS_I18N: Record<
  Lang,
  Record<
    | "MATH"
    | "PHYSICS"
    | "NATURAL_SCIENCES"
    | "PHILOSOPHY"
    | "ARABIC"
    | "FRENCH"
    | "ENGLISH"
    | "ACCOUNTING_FINANCE"
    | "ECONOMICS"
    | "HISTORY_GEOGRAPHY",
    string
  >
> = {
  fr: {
    MATH: "Mathématiques",
    PHYSICS: "Physique",
    NATURAL_SCIENCES: "Sciences naturelles",
    PHILOSOPHY: "Philosophie",
    ARABIC: "Arabe",
    FRENCH: "Français",
    ENGLISH: "Anglais",
    ACCOUNTING_FINANCE: "Comptabilité / Finance",
    ECONOMICS: "Économie",
    HISTORY_GEOGRAPHY: "Histoire-Géographie",
  },
  en: {
    MATH: "Mathematics",
    PHYSICS: "Physics",
    NATURAL_SCIENCES: "Natural sciences",
    PHILOSOPHY: "Philosophy",
    ARABIC: "Arabic",
    FRENCH: "French",
    ENGLISH: "English",
    ACCOUNTING_FINANCE: "Accounting / Finance",
    ECONOMICS: "Economics",
    HISTORY_GEOGRAPHY: "History-Geography",
  },
};

export function matchLabelText(lang: Lang, code: string): string {
  return code;
}
