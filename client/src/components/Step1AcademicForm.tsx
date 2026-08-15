import type {
  BacStream,
  ConfigResponse,
  StreamGradeSlots,
  SubjectCode,
  TechnicalMathOption,
} from "../types";
import { SLOT_LABELS, STREAM_LABELS, SUBJECT_LABELS } from "../types";
import type { WizardFormState } from "../hooks/useRecommendationWizard";

type Props = {
  config: ConfigResponse;
  form: WizardFormState;
  requiredSubjects: SubjectCode[];
  onFullName: (v: string) => void;
  onBacStream: (v: BacStream) => void;
  onTechnicalOption: (v: TechnicalMathOption | "") => void;
  onOverallBacMark: (v: string) => void;
  onGrade: (subject: SubjectCode, value: string) => void;
};

export function Step1AcademicForm({
  config,
  form,
  onFullName,
  onBacStream,
  onTechnicalOption,
  onOverallBacMark,
  onGrade,
}: Props) {
  const slots: StreamGradeSlots | null =
    form.bacStream && config.streamGradeSlots
      ? config.streamGradeSlots[form.bacStream]
      : null;

  const slotOrder: (keyof StreamGradeSlots)[] = ["main1", "main2", "opposite", "english"];
  const slotWeights = config.academicSlotWeights ?? {
    main1: 0.4,
    main2: 0.3,
    opposite: 0.2,
    english: 0.1,
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Academic profile
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fixed subjects per stream: 2 main modules, 1 opposite-stream module, and English.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</span>
        <input
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          value={form.fullName}
          onChange={(e) => onFullName(e.target.value)}
          placeholder="Student full name"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">BAC stream</span>
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          value={form.bacStream}
          onChange={(e) => onBacStream(e.target.value as BacStream)}
        >
          <option value="">Select stream…</option>
          {config.bacStreams.map((stream) => (
            <option key={stream} value={stream}>
              {STREAM_LABELS[stream]}
            </option>
          ))}
        </select>
      </label>

      {form.bacStream === "TECHNICAL_MATHEMATICS" && (
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Technical Mathematics option (génie)
          </span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={form.technicalOption}
            onChange={(e) => onTechnicalOption(e.target.value as TechnicalMathOption | "")}
          >
            <option value="">Select génie…</option>
            {config.technicalMathOptions.map((opt) => (
              <option key={opt} value={opt}>
                {config.technicalMathOptionLabels[opt]}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Overall BAC mark (0–20)
        </span>
        <input
          type="number"
          min={0}
          max={20}
          step={0.01}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          value={form.overallBacMark}
          onChange={(e) => onOverallBacMark(e.target.value)}
        />
      </label>

      {slots && form.bacStream && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Grades for {STREAM_LABELS[form.bacStream]}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {slotOrder.map((slotKey) => {
              const subject = slots[slotKey];
              return (
                <label key={slotKey} className="block">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {SLOT_LABELS[slotKey]} — {SUBJECT_LABELS[subject]}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.01}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    value={form.grades[subject] ?? ""}
                    onChange={(e) => onGrade(subject, e.target.value)}
                  />
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Slot mix: Main1 {Math.round(slotWeights.main1 * 100)}% · Main2{" "}
            {Math.round(slotWeights.main2 * 100)}% · Opposite {Math.round(slotWeights.opposite * 100)}% ·
            English {Math.round(slotWeights.english * 100)}%. Each mark is scaled by a specialty-specific
            multiplier (seed weights, aggressive range).
          </p>
        </div>
      )}
    </div>
  );
}
