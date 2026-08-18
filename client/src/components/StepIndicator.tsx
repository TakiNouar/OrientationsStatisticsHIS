import type { Lang } from "../i18n/strings";
import { strings } from "../i18n/strings";

type Props = {
  step: 1 | 2 | 3;
  lang: Lang;
  onGoToStep?: (step: 1 | 2 | 3) => void;
};

const ROMAN = ["I", "II", "III"] as const;

export function StepIndicator({ step, lang, onGoToStep }: Props) {
  const t = strings[lang] ?? strings.fr;
  const labels = [t.stepAcademic, t.stepRiasec, t.stepResults];
  const stepOfTemplate =
    typeof (t as { stepOf?: string }).stepOf === "string"
      ? (t as { stepOf: string }).stepOf
      : lang === "fr"
        ? "Étape {n} sur 3"
        : "Step {n} of 3";
  const stepOfLabel = stepOfTemplate.replace("{n}", String(step));

  return (
    <nav aria-label={stepOfLabel} className="mb-8">
      <ol className="flex flex-wrap items-end justify-center gap-6 sm:gap-10">
        {labels.map((label, index) => {
          const n = (index + 1) as 1 | 2 | 3;
          const active = n === step;
          const done = n < step;
          const canJump = Boolean(onGoToStep) && n < step;

          return (
            <li key={label ?? n}>
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onGoToStep?.(n)}
                className={[
                  "flex flex-col items-center gap-1 border-b-2 pb-1.5 transition-colors",
                  active
                    ? "border-brass text-ink"
                    : done
                      ? "border-transparent text-ink"
                      : "border-transparent text-brass-dim",
                  canJump ? "cursor-pointer hover:text-brass" : "cursor-default",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
              >
                <span className="font-mono text-xs tracking-widest text-brass">{ROMAN[index]}</span>
                <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center font-mono text-[11px] text-ink-muted">{stepOfLabel}</p>
      <hr className="intended-rule mt-4" />
    </nav>
  );
}
