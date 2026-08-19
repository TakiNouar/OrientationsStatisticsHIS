import { useCallback, useMemo, useState } from "react";
import { calculateRecommendations } from "../lib/api";
import type {
  BacStream,
  CalculationResult,
  ConfigResponse,
  RiasecLetter,
  SubjectCode,
  TechnicalMathOption,
  TopRiasecEntry,
  TopRiasecProfile,
} from "../types";
import type { Lang } from "../i18n/strings";
import { SUBJECT_LABELS_I18N, strings } from "../i18n/strings";

export type WizardStep = 1 | 2 | 3;

export type WizardFormState = {
  fullName: string;
  bacStream: BacStream | "";
  technicalOption: TechnicalMathOption | "";
  preferredSpecialtyCode: string;
  overallBacMark: string;
  grades: Partial<Record<SubjectCode, string>>;
  topRiasec: [TopRiasecEntry | null, TopRiasecEntry | null, TopRiasecEntry | null];
};

const emptyForm = (): WizardFormState => ({
  fullName: "",
  bacStream: "",
  technicalOption: "",
  preferredSpecialtyCode: "",
  overallBacMark: "",
  grades: {},
  topRiasec: [null, null, null],
});

/** Subjects shown on Step 1 (four academic slots). */
function subjectsFromSlots(
  config: ConfigResponse,
  bacStream: BacStream,
): SubjectCode[] {
  const slots = config.streamGradeSlots?.[bacStream];
  if (!slots) return [];
  return [slots.main1, slots.main2, slots.opposite, slots.english];
}

export function useRecommendationWizard(config: ConfigResponse | null, lang: Lang) {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<WizardFormState>(emptyForm);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({{}});
  const [loading, setLoading] = useState(false);

  const t = strings[lang] ?? strings.fr;
  const subjectLabels = SUBJECT_LABELS_I18N[lang] ?? SUBJECT_LABELS_I18N.fr;

  const requiredSubjects = useMemo(() => {
    if (!config || !form.bacStream) return [] as SubjectCode[];
    // Prefer the four UI slots so validation matches what the user can enter.
    const fromSlots = subjectsFromSlots(config, form.bacStream);
    if (fromSlots.length > 0) return fromSlots;
    // Fallback if slots missing from older config payloads.
    return (config.streamSubjectMap?.[form.bacStream] ?? []) as SubjectCode[];
  }, [config, form.bacStream]);

  const setFullName = (fullName: string) => setForm((prev) => ({ ...prev, fullName }));
  const setPreferredSpecialtyCode = (preferredSpecialtyCode: string) =>
    setForm((prev) => ({ ...prev, preferredSpecialtyCode }));

  const setBacStream = (bacStream: BacStream) => {
    setForm((prev) => {
      const hasGrades = Object.values(prev.grades).some((g) => g !== undefined && g !== "");
      if (hasGrades && prev.bacStream && prev.bacStream !== bacStream) {
        const ok = window.confirm(t.streamChangeConfirm);
        if (!ok) return prev;
      }
      return {
        ...prev,
        bacStream,
        technicalOption: bacStream === "TECHNICAL_MATHEMATICS" ? prev.technicalOption : "",
        grades: {},
      };
    });
  };

  const setTechnicalOption = (technicalOption: TechnicalMathOption | "") =>
    setForm((prev) => ({ ...prev, technicalOption }));

  const setOverallBacMark = (overallBacMark: string) =>
    setForm((prev) => ({ ...prev, overallBacMark }));

  const setGrade = (subject: SubjectCode, value: string) =>
    setForm((prev) => ({
      ...prev,
      grades: { ...prev.grades, [subject]: value },
    }));

  const setTopRiasecSlot = (index: 0 | 1 | 2, entry: TopRiasecEntry | null) =>
    setForm((prev) => {
      const next = [...prev.topRiasec] as WizardFormState["topRiasec"];
      next[index] = entry;
      return { ...prev, topRiasec: next };
    });

  const validateStep1 = useCallback((): Partial<Record<string, string>> => {
    const errors: Partial<Record<string, string>> = {};
    if (form.fullName.trim().length < 2) errors.fullName = t.errName;
    if (!form.bacStream) errors.bacStream = t.errStream;
    if (!form.preferredSpecialtyCode) errors.preferredSpecialtyCode = t.errPreferredSpecialty;
    if (form.bacStream === "TECHNICAL_MATHEMATICS" && !form.technicalOption) {
      errors.technicalOption = t.errGenie;
    }
    const overall = Number(form.overallBacMark);
    if (form.overallBacMark === "" || Number.isNaN(overall) || overall < 0 || overall > 20) {
      errors.overallBacMark = t.errOverall;
    }
    for (const subject of requiredSubjects) {
      const raw = form.grades[subject];
      const n = Number(raw);
      if (raw === undefined || raw === "" || Number.isNaN(n) || n < 0 || n > 20) {
        errors[`grade_${subject}`] = `${subjectLabels[subject] ?? subject}: invalid`;
      }
    }
    return errors;
  }, [form, requiredSubjects, subjectLabels, t]);

  const validateStep2 = useCallback((): Partial<Record<string, string>> => {
    const errors: Partial<Record<string, string>> = {};
    const entries = form.topRiasec;
    for (let i = 0; i < 3; i++) {
      const e = entries[i];
      if (!e || !e.letter) {
        errors[`riasec_letter_${i}`] = t.errRiasecSlot;
        continue;
      }
      if (!Number.isFinite(e.weight) || e.weight < 1 || e.weight > 100) {
        errors[`riasec_weight_${i}`] = t.errRiasecWeight;
      }
    }
    const letters = entries.filter((e): e is TopRiasecEntry => Boolean(e?.letter)).map((e) => e.letter);
    if (letters.length === 3 && new Set(letters).size !== 3) {
      errors.riasec = t.errRiasecDup;
    }
    return errors;
  }, [form.topRiasec, t]);

  const submit = async () => {
    if (!form.bacStream) return;
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(t.formErrors);
      return;
    }

    const grades: Partial<Record<SubjectCode, number>> = {};
    for (const [key, raw] of Object.entries(form.grades)) {
      if (raw !== undefined && raw !== "") {
        grades[key as SubjectCode] = Number(raw);
      }
    }

    const topRiasec = form.topRiasec as TopRiasecProfile;

    setLoading(true);
    setError(null);
    try {
      const data = await calculateRecommendations({
        fullName: form.fullName.trim(),
        bacStream: form.bacStream,
        preferredSpecialtyCode: form.preferredSpecialtyCode,
        technicalOption:
          form.bacStream === "TECHNICAL_MATHEMATICS" && form.technicalOption
            ? form.technicalOption
            : undefined,
        overallBacMark: Number(form.overallBacMark),
        grades,
        topRiasec,
      });
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setError(t.formErrors);
        return;
      }
      setFieldErrors({});
      setError(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      void submit();
    }
  };

  const goBack = () => {
    if (step <= 1) return;
    setError(null);
    setFieldErrors({});
    setStep((s) => (s === 3 ? 2 : 1) as WizardStep);
  };

  const goToStep = (target: 1 | 2 | 3) => {
    if (target >= step) return;
    setError(null);
    setFieldErrors({});
    setStep(target);
  };

  const reset = () => {
    setForm(emptyForm());
    setResult(null);
    setError(null);
    setFieldErrors({});
    setStep(1);
  };

  const selectedLetters = form.topRiasec
    .filter((e): e is TopRiasecEntry => e !== null)
    .map((e) => e.letter);

  /** Full RIASEC alphabet for selects; Step2 disables letters used in other slots. */
  const availableLetters = (config?.riasecLetters ??
    (["R", "I", "A", "S", "E", "C"] as RiasecLetter[])) as RiasecLetter[];

  return {
    step,
    form,
    result,
    error,
    fieldErrors,
    /** Preferred App name */
    submitting: loading,
    loading,
    requiredSubjects,
    selectedLetters,
    availableLetters,
    setFullName,
    setPreferredSpecialtyCode,
    /** Preferred App name */
    setPreferredSpecialty: setPreferredSpecialtyCode,
    setBacStream,
    setTechnicalOption,
    setOverallBacMark,
    setGrade,
    setTopRiasecSlot,
    /** Preferred App name */
    setRiasecSlot: setTopRiasecSlot,
    goNext,
    /** Preferred App name */
    next: goNext,
    goBack,
    goToStep,
    reset,
  };
}
