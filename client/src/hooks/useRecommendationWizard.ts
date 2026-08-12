import { useCallback, useMemo, useState } from "react";
import { calculateRecommendations } from "../lib/api";
import type {
  BacStream,
  CalculationResult,
  ConfigResponse,
  RiasecLetter,
  SubjectCode,
  TopRiasecEntry,
  TopRiasecProfile,
} from "../types";

export type WizardStep = 1 | 2 | 3;

export type WizardFormState = {
  fullName: string;
  bacStream: BacStream | "";
  overallBacMark: string;
  grades: Partial<Record<SubjectCode, string>>;
  topRiasec: [TopRiasecEntry | null, TopRiasecEntry | null, TopRiasecEntry | null];
};

const emptyForm = (): WizardFormState => ({
  fullName: "",
  bacStream: "",
  overallBacMark: "",
  grades: {},
  topRiasec: [null, null, null],
});

export function useRecommendationWizard(config: ConfigResponse | null) {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<WizardFormState>(emptyForm);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requiredSubjects = useMemo(() => {
    if (!config || !form.bacStream) return [] as SubjectCode[];
    return config.streamSubjects[form.bacStream] ?? [];
  }, [config, form.bacStream]);

  const setFullName = (fullName: string) => setForm((prev) => ({ ...prev, fullName }));

  const setBacStream = (bacStream: BacStream) =>
    setForm((prev) => ({
      ...prev,
      bacStream,
      grades: {},
    }));

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

  const validateStep1 = useCallback((): string | null => {
    if (form.fullName.trim().length < 2) return "Please enter the student full name.";
    if (!form.bacStream) return "Please select a BAC stream.";
    const mark = Number(form.overallBacMark);
    if (Number.isNaN(mark) || mark < 0 || mark > 20) {
      return "Overall BAC mark must be between 0 and 20.";
    }
    for (const subject of requiredSubjects) {
      const raw = form.grades[subject];
      const value = Number(raw);
      if (raw === undefined || raw === "" || Number.isNaN(value) || value < 0 || value > 20) {
        return `Please enter a valid grade (0–20) for ${subject}.`;
      }
    }
    return null;
  }, [form, requiredSubjects]);

  const validateStep2 = useCallback((): string | null => {
    const entries = form.topRiasec;
    if (entries.some((e) => e === null)) {
      return "Please select exactly three RIASEC letters.";
    }
    const letters = entries.map((e) => e!.letter);
    if (new Set(letters).size !== 3) {
      return "The three RIASEC letters must be distinct.";
    }
    for (const entry of entries) {
      if (!entry || entry.weight < 1 || entry.weight > 100) {
        return "Each RIASEC weight must be between 1 and 100.";
      }
    }
    return null;
  }, [form.topRiasec]);

  const goNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      void submit();
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const submit = async () => {
    if (!form.bacStream) return;
    const err = validateStep2();
    if (err) {
      setError(err);
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
    setStep(1);
  };

  const selectedLetters = form.topRiasec
    .filter((e): e is TopRiasecEntry => e !== null)
    .map((e) => e.letter);

  const availableLetters = (config?.riasecLetters ?? (["R", "I", "A", "S", "E", "C"] as RiasecLetter[])).filter(
    (letter) => !selectedLetters.includes(letter),
  );

  return {
    step,
    form,
    result,
    error,
    loading,
    requiredSubjects,
    availableLetters,
    setFullName,
    setBacStream,
    setOverallBacMark,
    setGrade,
    setTopRiasecSlot,
    goNext,
    goBack,
    reset,
  };
}
