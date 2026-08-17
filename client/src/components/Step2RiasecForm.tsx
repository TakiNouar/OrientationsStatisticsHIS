import type { ConfigResponse, RiasecLetter, TopRiasecEntry } from "../types";
import type { WizardFormState } from "../hooks/useRecommendationWizard";
import type { Lang } from "../i18n/strings";
import { strings } from "../i18n/strings";

type Props = {
  config: ConfigResponse;
  form: WizardFormState;
  availableLetters: RiasecLetter[];
  lang: Lang;
  fieldErrors: Partial<Record<string, string>>;
  disabled?: boolean;
  onSlotChange: (index: 0 | 1 | 2, entry: TopRiasecEntry | null) => void;
};

export function Step2RiasecForm({
  config,
  form,
  availableLetters,
  lang,
  fieldErrors,
  disabled,
  onSlotChange,
}: Props) {
  const t = strings[lang];
  const labels = config.riasecLabels;
  const rankLabels = [t.rank1, t.rank2, t.rank3];

  const codePreview = form.topRiasec
    .map((e) => e?.letter ?? "·")
    .join("");

  return (
    <div className={`space-y-6 text-left ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t.riasecTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.riasecHelp}</p>
      </div>

      <div
        className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-center dark:border-indigo-900 dark:bg-indigo-950/40"
        aria-live="polite"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
          {t.codePreview}
        </span>
        <div className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-indigo-900 dark:text-indigo-100">
          {codePreview}
        </div>
      </div>

      <div className="space-y-4">
        {([0, 1, 2] as const).map((index) => {
          const current = form.topRiasec[index];
          const options: RiasecLetter[] = current
            ? [current.letter, ...availableLetters]
            : availableLetters;
          const letterErr = fieldErrors[`riasec_letter_${index}`];
          const weightErr = fieldErrors[`riasec_weight_${index}`];

          return (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <div className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {rankLabels[index]}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-slate-500">{t.letter}</span>
                  <select
                    aria-invalid={Boolean(letterErr)}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
                      letterErr
                        ? "border-burgundy/50 focus:ring-burgundy/20"
                        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 dark:border-slate-600"
                    }`}
                    value={current?.letter ?? ""}
                    onChange={(e) => {
                      const letter = e.target.value as RiasecLetter | "";
                      if (!letter) {
                        onSlotChange(index, null);
                        return;
                      }
                      onSlotChange(index, {
                        letter,
                        weight: current?.weight ?? 70 - index * 15,
                      });
                    }}
                  >
                    <option value="">{t.selectLetter}</option>
                    {options.map((letter) => (
                      <option key={letter} value={letter}>
                        {letter} — {labels[letter]}
                      </option>
                    ))}
                  </select>
                  {letterErr && (
                    <p className="mt-1 text-xs text-burgundy dark:text-burgundy">{letterErr}</p>
                  )}
                </label>

                <div className="block">
                  <span className="text-xs text-slate-500">
                    {t.weight} {current ? `(${current.weight})` : ""}
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      disabled={!current}
                      className="w-full flex-1 accent-indigo-600"
                      value={current?.weight ?? 50}
                      onChange={(e) => {
                        if (!current) return;
                        onSlotChange(index, {
                          letter: current.letter,
                          weight: Number(e.target.value),
                        });
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      disabled={!current}
                      aria-invalid={Boolean(weightErr)}
                      className={`w-16 rounded-lg border px-2 py-1.5 text-center text-sm dark:bg-slate-900 ${
                        weightErr
                          ? "border-burgundy/50"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                      value={current?.weight ?? ""}
                      onChange={(e) => {
                        if (!current) return;
                        const w = Number(e.target.value);
                        if (Number.isNaN(w)) return;
                        onSlotChange(index, {
                          letter: current.letter,
                          weight: Math.min(100, Math.max(1, w)),
                        });
                      }}
                    />
                  </div>
                  {weightErr && (
                    <p className="mt-1 text-xs text-burgundy dark:text-burgundy">{weightErr}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {fieldErrors.riasec && (
        <p className="text-sm text-burgundy dark:text-burgundy">{fieldErrors.riasec}</p>
      )}

      <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {t.riasecScoringHelp}
      </div>
    </div>
  );
}
