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

const inputClass =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2.5 font-body text-sm text-ink transition-colors focus:outline-none focus:ring-2";
const okBorder =
  "border-brass-dim focus:border-brass focus:ring-brass/25";
const errBorder =
  "border-burgundy/50 focus:border-burgundy focus:ring-burgundy/20";
const errText = "mt-1 text-xs text-burgundy";

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
    <div className={`space-y-6 text-left font-body ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brass">
          {"stepRiasec" in t ? t.stepRiasec : "II"}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
          {t.riasecTitle}
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">{t.riasecHelp}</p>
      </div>

      <div
        className="border border-brass bg-surface px-4 py-4 text-center"
        aria-live="polite"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
          {t.codePreview}
        </span>
        <div className="mt-1.5 font-mono text-2xl font-medium tracking-[0.35em] text-ink">
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
              className="border border-brass-dim bg-surface/70 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-xs tracking-widest text-brass">
                  {["I", "II", "III"][index]}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {rankLabels[index]}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    {t.letter}
                  </span>
                  <select
                    aria-invalid={Boolean(letterErr)}
                    className={`${inputClass} ${letterErr ? errBorder : okBorder}`}
                    value={current?.letter ?? ""}
                    onChange={(e) => {
                      const letter = e.target.value as RiasecLetter | "";
                      if (!letter) {
                        onSlotChange(index, null);
                        return;
                      }
                      onSlotChange(index, {
                        letter,
                        weight: current?.weight ?? 50,
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
                  {letterErr && <p className={errText}>{letterErr}</p>}
                </label>

                <div className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    {t.weight} {current ? `(${current.weight})` : ""}
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      disabled={!current}
                      className="w-full flex-1 accent-brass"
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
                      className={`w-16 rounded-md border bg-surface px-2 py-1.5 text-center font-mono text-sm text-ink focus:outline-none focus:ring-2 ${
                        weightErr
                          ? "border-burgundy/50 focus:ring-burgundy/20"
                          : "border-brass-dim focus:border-brass focus:ring-brass/25"
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
                  {weightErr && <p className={errText}>{weightErr}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {fieldErrors.riasec && (
        <p className="text-sm text-burgundy">{fieldErrors.riasec}</p>
      )}

      <div className="border border-brass-dim bg-surface/50 px-4 py-3 text-sm text-ink-muted">
        {t.riasecScoringHelp}
      </div>
    </div>
  );
}
