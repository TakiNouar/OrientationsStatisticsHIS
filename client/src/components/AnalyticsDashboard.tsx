import type { AnalyticsDashboard, BacStream, MatchLabel } from "../types";
import type { Lang } from "../i18n/strings";
import { STREAM_LABELS_I18N, matchLabelText, strings } from "../i18n/strings";

type Props = {
  dashboard: AnalyticsDashboard;
  lang: Lang;
};

function BarChart({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; count: number }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {items.every((i) => i.count === 0) ? (
        <p className="mt-3 text-sm text-slate-500">—</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.key} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-700 dark:text-slate-200">{item.label}</span>
                <span className="shrink-0 font-semibold tabular-nums">{item.count}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VolumeChart({
  title,
  points,
  emptyLabel,
}: {
  title: string;
  points: Array<{ date: string; count: number }>;
  emptyLabel: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {points.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="mt-4 flex h-36 items-end gap-1">
          {points.map((p) => (
            <div key={p.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-slate-500">{p.count}</span>
              <div
                className="w-full max-w-[28px] rounded-t bg-cyan-500/90"
                style={{ height: `${Math.max(4, (p.count / max) * 100)}%` }}
                title={`${p.date}: ${p.count}`}
              />
              <span className="w-full truncate text-center text-[9px] text-slate-400">
                {p.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StreamSpecialtyMatrix({
  title,
  cells,
  lang,
  emptyLabel,
}: {
  title: string;
  cells: AnalyticsDashboard["streamSpecialtyMatrix"];
  lang: Lang;
  emptyLabel: string;
}) {
  const streamLabels = STREAM_LABELS_I18N[lang];
  const streams = [...new Set(cells.map((c) => c.bacStream))];
  const specialties = [
    ...new Map(cells.map((c) => [c.specialtyCode, c.specialtyTitle])).entries(),
  ];
  const max = Math.max(1, ...cells.map((c) => c.count));
  const lookup = new Map(cells.map((c) => [`${c.bacStream}|${c.specialtyCode}`, c.count]));

  if (cells.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white p-1 text-left dark:bg-slate-900"> </th>
              {specialties.map(([code, title]) => (
                <th
                  key={code}
                  className="max-w-[72px] truncate p-1 text-center font-medium text-slate-500"
                  title={title}
                >
                  {code.replace(/^HIS-/, "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {streams.map((stream) => (
              <tr key={stream}>
                <th className="sticky left-0 bg-white p-1 text-left font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {streamLabels[stream as BacStream] ?? stream}
                </th>
                {specialties.map(([code]) => {
                  const count = lookup.get(`${stream}|${code}`) ?? 0;
                  const intensity = count / max;
                  return (
                    <td key={code} className="p-0.5 text-center">
                      <div
                        className="flex h-8 items-center justify-center rounded text-[10px] font-semibold tabular-nums"
                        style={{
                          backgroundColor:
                            count === 0
                              ? "transparent"
                              : `rgba(99, 102, 241, ${0.15 + intensity * 0.75})`,
                          color: intensity > 0.55 ? "white" : undefined,
                        }}
                        title={`${stream} → ${code}: ${count}`}
                      >
                        {count || ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AnalyticsDashboardPanel({ dashboard, lang }: Props) {
  const t = strings[lang];
  const dq = dashboard.dataQuality;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t.dashboardTitle}
      </h3>

      <div className="grid gap-4 lg:grid-cols-2">
        <VolumeChart
          title={t.volumeByDay}
          points={dashboard.volumeByDay}
          emptyLabel={t.noChartData}
        />
        <BarChart
          title={t.scoreBuckets}
          items={dashboard.scoreBuckets.map((b) => ({
            key: b.key,
            label: b.label,
            count: b.count,
          }))}
        />
      </div>

      <BarChart
        title={t.byMatchLabel}
        items={dashboard.byMatchLabel.map((r) => ({
          key: r.key,
          label: matchLabelText(lang, r.key as MatchLabel),
          count: r.count,
        }))}
      />

      <StreamSpecialtyMatrix
        title={t.streamSpecialtyMatrix}
        cells={dashboard.streamSpecialtyMatrix}
        lang={lang}
        emptyLabel={t.noChartData}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t.dataQuality}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
            <p className="text-[11px] text-slate-500">{t.avgFinalScore}</p>
            <p className="text-xl font-bold tabular-nums">
              {dq.averageFinalScore != null ? `${dq.averageFinalScore}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
            <p className="text-[11px] text-slate-500">{t.avgBac}</p>
            <p className="text-xl font-bold tabular-nums">
              {dq.averageOverallBac != null ? dq.averageOverallBac : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
            <p className="text-[11px] text-slate-500">{t.highScores}</p>
            <p className="text-xl font-bold tabular-nums">{dq.highScoreSessions}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
            <p className="text-[11px] text-slate-500">{t.lowScores}</p>
            <p className="text-xl font-bold tabular-nums">{dq.lowScoreSessions}</p>
          </div>
        </div>
        {dq.neverRankedSpecialtyCodes.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">{t.neverRanked}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {dq.neverRankedSpecialtyCodes.map((s) => (
                <li
                  key={s.code}
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  title={s.title}
                >
                  {s.code}
                </li>
              ))}
            </ul>
          </div>
        )}
        {dq.sessionsMissingRiasec > 0 && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            {t.missingRiasec}: {dq.sessionsMissingRiasec}
          </p>
        )}
      </section>
    </div>
  );
}
