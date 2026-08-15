import type { Lang } from "../i18n/strings";
import { strings } from "../i18n/strings";

type Props = {
  step: 1 | 2 | 3;
  lang: Lang;
  onGoToStep?: (step: 1 | 2 | 3) => void;
};

export function StepIndicator({ step, lang, onGoToStep }: Props) {
  const t = strings[lang];
  const labels = [t.stepAcademic, t.stepRiasec, t.stepResults];

  return (
    <nav aria-label={t.stepOf.replace("{n}", String(step))} className="mb-8">
      <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {labels.map((label, index) => {
          const n = (index + 1) as 1 | 2 | 3;
          const active = n === step;
          const done = n < step;
          const canJump = Boolean(onGoToStep) && n < step;

          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onGoToStep?.(n)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-1 py-0.5 text-left",
                  canJump ? "cursor-pointer hover:opacity-90" : "cursor-default",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={[
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                    active
                      ? "bg-indigo-600 text-white"
                      : done
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                  ].join(" ")}
                >
                  {done ? "✓" : n}
                </span>
                <span
                  className={[
                    "text-sm font-medium",
                    active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500",
                  ].join(" ")}
                >
                  {label}
                </span>
              </button>
              {n < 3 && (
                <span className="hidden text-slate-300 sm:inline" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs text-slate-400">{t.stepOf.replace("{n}", String(step))}</p>
    </nav>
  );
}
