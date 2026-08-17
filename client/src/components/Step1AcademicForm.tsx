import type {
  BacStream,
  ConfigResponse,
  StreamGradeSlots,
  SubjectCode,
  TechnicalMathOption,
} from "../types";
import type { WizardFormState } from "../hooks/useRecommendationWizard";
import type { Lang } from "../i18n/strings";
import { STREAM_LABELS_I18N, SUBJECT_LABELS_I18N, strings } from "../i18n/strings";

type Props = {
  config: ConfigResponse;
  form: WizardFormState;
  lang: Lang;
  fieldErrors: Partial<Record<string, string>>;
  disabled?: boolean;
  onFullName: (v: string) => void;
  onBacStream: (v: BacStream) => void;
  onTechnicalOption: (v: TechnicalMathOption | "") => void;
  onPreferredSpecialty: (v: string) => void;
  onOverallBacMark: (v: string) => void;
  onGrade: (subject: SubjectCode, value: string) => void;
};

const inputClass =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2.5 font-body text-sm text-ink shadow-none transition-colors focus:outline-none focus:ring-2";
const okBorder =
  "border-brass-dim focus:border-brass focus:ring-brass/25";
const errBorder =
  "border-burgundy/50 focus:border-burgundy focus:ring-burgundy/20";
const labelClass = "text-sm font-medium text-ink";
const helpClass = "mt-1 text-xs text-ink-muted";
const errText = "mt-1 text-xs text-burgundy";

export function Step1AcademicForm({
  config,
  form,
  lang,
  fieldErrors,
  disabled,
  onFullName,
  onBacStream,
  onTechnicalOption,
  onPreferredSpecialty,
  onOverallBacMark,
  onGrade,
}: Props) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const subjectLabels = SUBJECT_LABELS_I18N[lang];

  const slots: StreamGradeSlots | null =
    form.bacStream && config.streamGradeSlots
      ? config.streamGradeSlots[form.bacStream]
      : null;

  const slotOrder: (keyof StreamGradeSlots)[] = ["main1", "main2", "opposite", "english"];
  const slotLabel = {
    main1: t.slotMain1,
    main2: t.slotMain2,
    opposite: t.slotOpposite,
    english: t.slotEnglish,
  };

  return (
    <div className={`space-y-6 text-left font-body ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brass">
          {"stepAcademic" in t ? t.stepAcademic : "I"}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
          {t.academicTitle}
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">{t.academicHelp}</p>
      </div>

      <label className="block">
        <span className={labelClass}>{t.fullName}</span>
        <input
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.fullName)}
          className={`${inputClass} ${fieldErrors.fullName ? errBorder : okBorder}`}
          value={form.fullName}
          onChange={(e) => onFullName(e.target.value)}
        />
        {fieldErrors.fullName && <p className={errText}>{fieldErrors.fullName}</p>}
      </label>

      <label className="block">
        <span className={labelClass}>{t.preferredSpecialty}</span>
        <select
          aria-invalid={Boolean(fieldErrors.preferredSpecialtyCode)}
          className={`${inputClass} ${fieldErrors.preferredSpecialtyCode ? errBorder : okBorder}`}
          value={form.preferredSpecialtyCode}
          onChange={(e) => onPreferredSpecialty(e.target.value)}
        >
          <option value="">{t.selectPreferredSpecialty}</option>
          {config.specialties.map((s) => (
            <option key={s.code} value={s.code}>
              {s.title} ({s.code})
            </option>
          ))}
        </select>
        {fieldErrors.preferredSpecialtyCode && (
          <p className={errText}>{fieldErrors.preferredSpecialtyCode}</p>
        )}
        <p className={helpClass}>{t.preferredSpecialtyHelp}</p>
      </label>

      <label className="block">
        <span className={labelClass}>{t.bacStream}</span>
        <select
          aria-invalid={Boolean(fieldErrors.bacStream)}
          className={`${inputClass} ${fieldErrors.bacStream ? errBorder : okBorder}`}
          value={form.bacStream}
          onChange={(e) => onBacStream(e.target.value as BacStream)}
        >
          <option value="">{t.selectStream}</option>
          {config.bacStreams.map((stream) => (
            <option key={stream} value={stream}>
              {streamLabels[stream]}
            </option>
          ))}
        </select>
        {fieldErrors.bacStream && <p className={errText}>{fieldErrors.bacStream}</p>}
      </label>

      {form.bacStream === "TECHNICAL_MATHEMATICS" && (
        <label className="block">
          <span className={labelClass}>{t.genieOption}</span>
          <select
            aria-invalid={Boolean(fieldErrors.technicalOption)}
            className={`${inputClass} ${fieldErrors.technicalOption ? errBorder : okBorder}`}
            value={form.technicalOption}
            onChange={(e) => onTechnicalOption(e.target.value as TechnicalMathOption | "")}
          >
            <option value="">{t.selectGenie}</option>
            {config.technicalMathOptions.map((opt) => (
              <option key={opt} value={opt}>
                {config.technicalMathOptionLabels[opt]}
              </option>
            ))}
          </select>
          {fieldErrors.technicalOption && (
            <p className={errText}>{fieldErrors.technicalOption}</p>
          )}
        </label>
      )}

      <label className="block">
        <span className={labelClass}>{t.overallMark}</span>
        <input
          type="number"
          min={0}
          max={20}
          step={0.01}
          inputMode="decimal"
          aria-invalid={Boolean(fieldErrors.overallBacMark)}
          className={`${inputClass} ${fieldErrors.overallBacMark ? errBorder : okBorder}`}
          value={form.overallBacMark}
          onChange={(e) => onOverallBacMark(e.target.value)}
        />
        {fieldErrors.overallBacMark && (
          <p className={errText}>{fieldErrors.overallBacMark}</p>
        )}
      </label>

      {slots && form.bacStream && (
        <div className="border border-brass-dim bg-surface/60 p-4">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">
            {t.gradesHeading}
            <span className="ml-2 font-body text-xs font-normal text-ink-muted">
              — {streamLabels[form.bacStream]}
            </span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {slotOrder.map((slotKey) => {
              const subject = slots[slotKey];
              const err = fieldErrors[`grade_${subject}`];
              return (
                <label key={slotKey} className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    {slotLabel[slotKey]}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink">
                    {subjectLabels[subject]}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.01}
                    inputMode="decimal"
                    aria-invalid={Boolean(err)}
                    className={`${inputClass} ${err ? errBorder : okBorder}`}
                    value={form.grades[subject] ?? ""}
                    onChange={(e) => onGrade(subject, e.target.value)}
                  />
                  {err && <p className={errText}>{err}</p>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
