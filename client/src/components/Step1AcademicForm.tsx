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

const inputClass = "intended-field mt-1";
const okBorder = "";
const errBorder = "intended-field-error";
const labelClass = "intended-label";
const helpClass = "mt-1.5 text-xs leading-relaxed text-ink-muted";
const errText = "mt-1.5 text-xs font-medium text-burgundy";

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
          {t.stepAcademic}
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
          value={form.fullName}
          onChange={(e) => onFullName(e.target.value)}
          className={`${inputClass} ${fieldErrors.fullName ? errBorder : okBorder}`}
          autoComplete="name"
          disabled={disabled}
        />
        {fieldErrors.fullName && <p className={errText}>{fieldErrors.fullName}</p>}
      </label>

      <label className="block">
        <span className={labelClass}>{t.preferredSpecialty}</span>
        <select
          value={form.preferredSpecialtyCode}
          onChange={(e) => onPreferredSpecialty(e.target.value)}
          className={`${inputClass} ${fieldErrors.preferredSpecialtyCode ? errBorder : okBorder}`}
          disabled={disabled}
        >
          <option value="">{t.selectPreferred}</option>
          {config.specialties.map((s) => (
            <option key={s.code} value={s.code}>
              {s.title}
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
          value={form.bacStream}
          onChange={(e) => onBacStream(e.target.value as BacStream)}
          className={`${inputClass} ${fieldErrors.bacStream ? errBorder : okBorder}`}
          disabled={disabled}
        >
          <option value="">{t.selectStream}</option>
          {config.bacStreams.map((s) => (
            <option key={s} value={s}>
              {streamLabels[s]}
            </option>
          ))}
        </select>
        {fieldErrors.bacStream && <p className={errText}>{fieldErrors.bacStream}</p>}
      </label>

      {form.bacStream === "TECHNICAL_MATHEMATICS" && (
        <label className="block">
          <span className={labelClass}>{t.genieOption}</span>
          <select
            value={form.technicalOption}
            onChange={(e) => onTechnicalOption(e.target.value as TechnicalMathOption | "")}
            className={`${inputClass} ${fieldErrors.technicalOption ? errBorder : okBorder}`}
            disabled={disabled}
          >
            <option value="">{t.selectGenie}</option>
            {config.technicalMathOptions.map((o) => (
              <option key={o} value={o}>
                {config.technicalMathOptionLabels[o]}
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
          value={form.overallBacMark}
          onChange={(e) => onOverallBacMark(e.target.value)}
          className={`${inputClass} ${fieldErrors.overallBacMark ? errBorder : okBorder}`}
          disabled={disabled}
        />
        {fieldErrors.overallBacMark && (
          <p className={errText}>{fieldErrors.overallBacMark}</p>
        )}
      </label>

      {slots && (
        <div className="border border-brass-dim/80 bg-surface/40 p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">
            {t.gradesTitle}
            <span className="ml-2 font-body text-xs font-normal text-ink-muted">
              {t.gradesHelp}
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
                    {subjectLabels[subject] ?? subject}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.01}
                    value={form.grades[subject] ?? ""}
                    onChange={(e) => onGrade(subject, e.target.value)}
                    className={`${inputClass} ${err ? errBorder : okBorder}`}
                    disabled={disabled}
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
