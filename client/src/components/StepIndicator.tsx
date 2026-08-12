type Props = {
  step: 1 | 2 | 3;
};

const labels = ["Academic", "RIASEC Top 3", "Results"];

export function StepIndicator({ step }: Props) {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
      {labels.map((label, index) => {
        const n = (index + 1) as 1 | 2 | 3;
        const active = n === step;
        const done = n < step;
        return (
          <li key={label} className="flex items-center gap-2">
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
              {n}
            </span>
            <span
              className={[
                "text-sm font-medium",
                active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500",
              ].join(" ")}
            >
              {label}
            </span>
            {n < 3 && <span className="hidden sm:inline text-slate-300 mx-1">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
