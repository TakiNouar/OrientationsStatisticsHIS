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
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brass">
          {t.stepRiasec}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
          {t.riasecTitle}
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">{t.riasecHelp}</p>
      </div>

      {/* Live code preview as quiet monogram frame */}
      <div className="flex items-center justify-center border border-brass-dim/70 bg-surface/50 py-5">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
            {t.codePreview}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.28em] text-brass">
            {codePreview || "···"}
          </p>
        </div>
      </div>

      <section className="space-y-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          {lang === "fr" ? "Lettres dominantes" : "Dominant letters"}
        </p>
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
            <div key={index} className="grid gap-3 border-b border-brass-dim/40 pb-5 last:border-0 sm:grid-cols-2">
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
      </section>

      {fieldErrors.riasec && <p className="text-sm text-burgundy">{fieldErrors.riasec}</p>}

      <p className="text-xs leading-relaxed text-ink-muted">{t.riasecScoringHelp}</p>
    </div>
  );
}
