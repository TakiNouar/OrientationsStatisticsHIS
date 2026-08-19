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

const inputClass = "intended-field mt-1";
const errBorder = "intended-field-error";
const labelClass = "intended-label";
const errText = "mt-1.5 text-xs font-medium text-burgundy";

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

  const codePreview = form.topRiasec.map((e) => e?.letter ?? "·").join("");

  return (
    <div className={`space-y-8 text-left font-body ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">{t.stepRiasec}</p>
        <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {t.riasecTitle}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-muted">{t.riasecHelp}</p>
      </div>

      <p className="font-mono text-sm tracking-wide text-ink-muted">
        {t.codePreview}:{" "}
        <span className="font-semibold tracking-[0.22em] text-brass">{codePreview || "···"}</span>
      </p>

      <div className="orientation-inset space-y-5">
        {([0, 1, 2] as const).map((index) => {
          const entry = form.topRiasec[index];
          const letterErr = fieldErrors[`riasec_letter_${index}`];
          const weightErr = fieldErrors[`riasec_weight_${index}`];
          const usedElsewhere = new Set(
            form.topRiasec
              .map((e, i) => (i !== index && e?.letter ? e.letter : null))
              .filter(Boolean) as RiasecLetter[],
          );

          return (
            <div key={index} className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>{rankLabels[index]}</span>
                <select
                  value={entry?.letter ?? ""}
                  onChange={(e) => {
                    const letter = e.target.value as RiasecLetter | "";
                    if (!letter) {
                      onSlotChange(index, null);
                      return;
                    }
                    onSlotChange(index, {
                      letter,
                      weight: entry?.weight ?? (index === 0 ? 50 : index === 1 ? 30 : 20),
                    });
                  }}
                  className={`${inputClass} ${letterErr ? errBorder : ""}`}
                  disabled={disabled}
                >
                  <option value="">{t.selectLetter}</option>
                  {availableLetters.map((letter) => (
                    <option key={letter} value={letter} disabled={usedElsewhere.has(letter)}>
                      {letter} — {labels[letter]}
                    </option>
                  ))}
                </select>
                {letterErr && <p className={errText}>{letterErr}</p>}
              </label>

              <label className="block">
                <span className={labelClass}>{t.weight}</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={entry?.weight ?? ""}
                  onChange={(e) => {
                    const weight = Number(e.target.value);
                    if (!entry?.letter) return;
                    onSlotChange(index, {
                      letter: entry.letter,
                      weight: Number.isFinite(weight) ? weight : 0,
                    });
                  }}
                  className={`${inputClass} ${weightErr ? errBorder : ""}`}
                  disabled={disabled || !entry?.letter}
                />
                {weightErr && <p className={errText}>{weightErr}</p>}
              </label>
            </div>
          );
        })}
      </div>

      {fieldErrors.riasec && <p className="text-sm text-burgundy">{fieldErrors.riasec}</p>}

      <p className="text-xs leading-relaxed text-ink-muted">{t.riasecScoringHelp}</p>
    </div>
  );
}
