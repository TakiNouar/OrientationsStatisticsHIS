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
  onOverallBacMark: (v: string) => void;
  onGrade: (subject: SubjectCode, value: string) => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-100";
const okBorder = "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 dark:border-slate-600";
const errBorder = "border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-700";

export function Step1AcademicForm({
  config,
  form,
  lang,
  fieldErrors,
  disabled,
  onFullName,
  onBacStream,
  onTechnicalOption,
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
    <div className={`space-y-6 text-left ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t.academicTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.academicHelp}</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.fullName}</span>
        <input
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.fullName)}
          className={`${inputClass} ${fieldErrors.fullName ? errBorder : okBorder}`}
          value={form.fullName}
          onChange={(e) => onFullName(e.target.value)}
          placeholder={t.fullNamePlaceholder}
        />
        {fieldErrors.fullName && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.fullName}</p>
        )}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.bacStream}</span>
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
        {fieldErrors.bacStream && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.bacStream}</p>
        )}
      </label>

      {form.bacStream === "TECHNICAL_MATHEMATICS" && (
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.genieOption}</span>
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
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.technicalOption}</p>
          )}
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.overallMark}</span>
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
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.overallBacMark}</p>
        )}
      </label>

      {slots && form.bacStream && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t.gradesHeading} — {streamLabels[form.bacStream]}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {slotOrder.map((slotKey) => {
              const subject = slots[slotKey];
              const err = fieldErrors[`grade_${subject}`];
              return (
                <label key={slotKey} className="block">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {slotLabel[slotKey]} — {subjectLabels[subject]}
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
                  {err && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{err}</p>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
