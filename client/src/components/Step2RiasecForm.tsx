import type { ConfigResponse, RiasecLetter, TopRiasecEntry } from "../types";
import type { WizardFormState } from "../hooks/useRecommendationWizard";

type Props = {
  config: ConfigResponse;
  form: WizardFormState;
  availableLetters: RiasecLetter[];
  onSlotChange: (index: 0 | 1 | 2, entry: TopRiasecEntry | null) => void;
};

const rankLabels = ["1st (strongest)", "2nd", "3rd"];

export function Step2RiasecForm({ config, form, availableLetters, onSlotChange }: Props) {
  const labels = config.riasecLabels;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Top 3 RIASEC profile
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select your three strongest Holland themes and assign a weight (1–100) to each.
          Higher weight = stronger preference.
        </p>
      </div>

      <div className="space-y-4">
        {([0, 1, 2] as const).map((index) => {
          const current = form.topRiasec[index];
          const options: RiasecLetter[] = current
            ? [current.letter, ...availableLetters]
            : availableLetters;

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
                  <span className="text-xs text-slate-500">Letter</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
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
                    <option value="">Select…</option>
                    {options.map((letter) => (
                      <option key={letter} value={letter}>
                        {letter} — {labels[letter]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-slate-500">
                    Weight {current ? `(${current.weight})` : ""}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    disabled={!current}
                    className="mt-3 w-full accent-indigo-600"
                    value={current?.weight ?? 50}
                    onChange={(e) => {
                      if (!current) return;
                      onSlotChange(index, {
                        letter: current.letter,
                        weight: Number(e.target.value),
                      });
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
        <strong>How it is scored:</strong> your three letters are expanded into a 6D vector
        (other dimensions = 0). Cosine similarity is computed against each specialty’s RIASEC
        benchmark, then mixed 30% with the academic score (70%).
      </div>
    </div>
  );
}
