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
        errors[`grade_${subject}`] = t.errGrade.replace("{subject}", subjectLabels[subject] ?? subject);
      }
    }
    return errors;
  }, [form, requiredSubjects, subjectLabels, t]);

  const validateStep2 = useCallback((): Partial<Record<string, string>> => {
    const errors: Partial<Record<string, string>> = {};
    const entries = form.topRiasec;
    for (let i = 0; i < 3; i++) {
      const e = entries[i];
      if (!e) {
        errors[`riasec_${i}`] = t.errRiasecSlot;
        continue;
      }
      if (!e.letter || e.weight < 1 || e.weight > 100) {
        errors[`riasec_${i}`] = t.errRiasecWeight;
      }
    }
    const letters = entries.filter(Boolean).map((e) => e!.letter);
    if (new Set(letters).size !== letters.length) {
      errors.riasec_dup = t.errRiasecDup;
    }
    return errors;
  }, [form.topRiasec, t]);

  const nextFromStep1 = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(t.fixErrors);
      return;
    }
    setFieldErrors({});
    setError(null);
    setStep(2);
  };

  const nextFromStep2 = () => {
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(t.fixErrors);
      return;
    }
    setFieldErrors({});
    setError(null);
    void submit();
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

  return {
    step,
    form,
    result,
    error,
    fieldErrors,
    loading,
    requiredSubjects,
    selectedLetters,
    setFullName,
    setPreferredSpecialtyCode,
    setBacStream,
    setTechnicalOption,
    setOverallBacMark,
    setGrade,
    setTopRiasecSlot,
    nextFromStep1,
    nextFromStep2,
    goToStep,
    reset,
  };
}
