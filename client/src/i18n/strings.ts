export type Lang = "fr" | "en";

export const strings = {
  fr: {
    appTitle: "HIS-SRE · Orientation",
    appSubtitle: "Aide à l'orientation",
    disclaimer: "Outil d'aide à la décision. Les résultats ne remplacent pas un entretien d'orientation.",
    loadingConfig: "Chargement de la configuration…",
    configError: "Impossible de charger la configuration du serveur.",
    retry: "Réessayer",
    navWizard: "Orientation",
    navAnalytics: "Statistiques",
    academicTitle: "Profil académique",
    academicHelp: "Renseignez le nom, la filière, la spécialité préférée et les notes.",
    fullName: "Nom complet",
    preferredSpecialty: "Spécialité préférée (HIS)",
    selectPreferredSpecialty: "Choisir une spécialité…",
    preferredSpecialtyHelp:
      "Choix obligatoire. Préférence : 100 pour la spécialité choisie, 50 pour les autres (5 % du score final).",
    errPreferredSpecialty: "Sélectionnez votre spécialité HIS préférée.",
    bacStream: "Filière du bac",
    selectStream: "Choisir une filière…",
    genieOption: "Option génie (Maths techniques)",
    selectGenie: "Choisir une option…",
    overallMark: "Moyenne générale du bac (/20)",
    gradesHeading: "Notes par module",
    slotMain1: "Module principal 1",
    slotMain2: "Module principal 2",
    slotOpposite: "Module opposé",
    slotEnglish: "Anglais",
    next: "Suivant",
    back: "Retour",
    calculate: "Calculer",
    calculating: "Calcul en cours…",
    formErrors: "Corrigez les champs indiqués.",
    errName: "Nom trop court.",
    errStream: "Sélectionnez une filière.",
    errGenie: "Sélectionnez une option génie.",
    errOverall: "Moyenne invalide (0–20).",
    streamChangeConfirm: "Changer de filière efface les notes saisies. Continuer ?",
    riasecTitle: "Profil RIASEC",
    riasecHelp: "Indiquez vos 3 lettres dominantes et un poids relatif.",
    preference: "Préférence",
    academic: "Académique",
    riasec: "RIASEC",
    technical: "Technique",
    weightsLine: "Pondération",
    resultsTitle: "Résultats",
    newSession: "Nouvelle session",
  },
  en: {
    appTitle: "HIS-SRE · Orientation",
    appSubtitle: "Orientation support",
    disclaimer: "Decision-support tool. Results do not replace counseling.",
    loadingConfig: "Loading configuration…",
    configError: "Could not load server configuration.",
    retry: "Retry",
    navWizard: "Orientation",
    navAnalytics: "Statistics",
    academicTitle: "Academic profile",
    academicHelp: "Enter name, stream, preferred specialty, and grades.",
    fullName: "Full name",
    preferredSpecialty: "Preferred specialty (HIS)",
    selectPreferredSpecialty: "Select a specialty…",
    preferredSpecialtyHelp:
      "Required. Preference: 100 for the chosen specialty, 50 for the others (5% of final score).",
    errPreferredSpecialty: "Select your preferred HIS specialty.",
    bacStream: "BAC stream",
    selectStream: "Select a stream…",
    genieOption: "Génie option (Technical mathematics)",
    selectGenie: "Select an option…",
    overallMark: "Overall BAC mark (/20)",
    gradesHeading: "Module grades",
    slotMain1: "Main module 1",
    slotMain2: "Main module 2",
    slotOpposite: "Opposite module",
    slotEnglish: "English",
    next: "Next",
    back: "Back",
    calculate: "Calculate",
    calculating: "Calculating…",
    formErrors: "Please fix the highlighted fields.",
    errName: "Name is too short.",
    errStream: "Select a stream.",
    errGenie: "Select a génie option.",
    errOverall: "Invalid overall mark (0–20).",
    streamChangeConfirm: "Changing stream clears entered grades. Continue?",
    riasecTitle: "RIASEC profile",
    riasecHelp: "Enter your top 3 letters and relative weights.",
    preference: "Preference",
    academic: "Academic",
    riasec: "RIASEC",
    technical: "Technical",
    weightsLine: "Weights",
    resultsTitle: "Results",
    newSession: "New session",
  },
} as const;

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
