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
  overallBacMark: string;
  grades: Partial<Record<SubjectCode, string>>;
  topRiasec: [TopRiasecEntry | null, TopRiasecEntry | null, TopRiasecEntry | null];
};

const emptyForm = (): WizardFormState => ({
  fullName: "",
  bacStream: "",
  technicalOption: "",
  overallBacMark: "",
  grades: {},
  topRiasec: [null, null, null],
});

export function useRecommendationWizard(config: ConfigResponse | null, lang: Lang) {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<WizardFormState>(emptyForm);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);

  const t = strings[lang];
  const subjectLabels = SUBJECT_LABELS_I18N[lang];

  const requiredSubjects = useMemo(() => {
    if (!config || !form.bacStream) return [] as SubjectCode[];
    return config.streamSubjects[form.bacStream] ?? [];
  }, [config, form.bacStream]);

  const setFullName = (fullName: string) => setForm((prev) => ({ ...prev, fullName }));

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
    if (form.bacStream === "TECHNICAL_MATHEMATICS" && !form.technicalOption) {
      errors.technicalOption = t.errGenie;
    }
    const overall = Number(form.overallBacMark);
    if (form.overallBacMark === "" || Number.isNaN(overall) || overall < 0 || overall > 20) {
      errors.overallBacMark = t.errOverall;
    }
    for (const subject of requiredSubjects) {
      const raw = form.grades[subject];
      if (raw === undefined || raw === "") {
        errors[`grade_${subject}`] = t.errMissingGrade.replace(
          "{subject}",
          subjectLabels[subject],
        );
        continue;
      }
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > 20) {
        errors[`grade_${subject}`] = t.errGrade.replace("{subject}", subjectLabels[subject]);
      }
    }
    return errors;
  }, [form, requiredSubjects, t, subjectLabels]);

  const validateStep2 = useCallback((): Partial<Record<string, string>> => {
    const errors: Partial<Record<string, string>> = {};
    const entries = form.topRiasec;
    if (entries.some((e) => !e)) {
      errors.riasec = t.errRiasecAll;
      entries.forEach((e, i) => {
        if (!e) errors[`riasec_letter_${i}`] = t.errRiasecAll;
      });
      return errors;
    }
    const letters = entries.map((e) => e!.letter);
    if (new Set(letters).size !== 3) {
      errors.riasec = t.errRiasecDistinct;
    }
    for (let i = 0; i < 3; i += 1) {
      const entry = entries[i]!;
      if (entry.weight < 1 || entry.weight > 100) {
        errors[`riasec_weight_${i}`] = t.errRiasecWeight;
      }
    }
    return errors;
  }, [form.topRiasec, t]);

  const goNext = () => {
    setError(null);
    if (step === 1) {
      const errs = validateStep1();
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        setError(t.fixErrors);
        return;
      }
      setFieldErrors({});
      setStep(2);
      return;
    }
    if (step === 2) {
      const errs = validateStep2();
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        setError(t.fixErrors);
        return;
      }
      setFieldErrors({});
      void submit();
    }
  };

  const goBack = () => {
    setError(null);
    setFieldErrors({});
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const goToStep = (target: 1 | 2 | 3) => {
    if (target >= step) return;
    setError(null);
    setFieldErrors({});
    setStep(target);
  };

  const submit = async () => {
    if (!form.bacStream) return;
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(t.fixErrors);
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

  const availableLetters = (
    config?.riasecLetters ?? (["R", "I", "A", "S", "E", "C"] as RiasecLetter[])
  ).filter((letter) => !selectedLetters.includes(letter));

  return {
    step,
    form,
    result,
    error,
    fieldErrors,
    loading,
    requiredSubjects,
    availableLetters,
    setFullName,
    setBacStream,
    setTechnicalOption,
    setOverallBacMark,
    setGrade,
    setTopRiasecSlot,
    goNext,
    goBack,
    goToStep,
    reset,
  };
}
