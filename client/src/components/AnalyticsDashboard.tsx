import { useMemo } from "react";
import type { AnalyticsDashboard, BacStream, MatchLabel } from "../types";
import type { Lang } from "../i18n/strings";
import { STREAM_LABELS_I18N, matchLabelText, strings } from "../i18n/strings";

type Props = {
  dashboard: AnalyticsDashboard;
  lang: Lang;
  totalSessions?: number;
};

const LABEL_COLORS: Record<MatchLabel, string> = {
  STRONG_MATCH: "#10b981",
  STRONG_MATCH_CONVERSATION: "#14b8a6",
  POSSIBLE_FIT: "#f59e0b",
  PROFILE_DEVELOPING: "#f97316",
  WEAK_MATCH: "#94a3b8",
};

const BUCKET_COLORS = ["#94a3b8", "#fb923c", "#fbbf24", "#2dd4bf", "#34d399"];

function Card({ children, className = "", delay }: { children: React.ReactNode; className?: string; delay?: number }) {
  const delayClass =
    delay === 1
      ? "analytics-rise-delay-1"
      : delay === 2
        ? "analytics-rise-delay-2"
        : delay === 3
          ? "analytics-rise-delay-3"
          : delay === 4
            ? "analytics-rise-delay-4"
            : "";
  return <div className={`analytics-card analytics-rise p-5 ${delayClass} ${className}`}>{children}</div>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      <div>
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

/** SVG area + line chart for volume by day */
function AreaVolumeChart({
  title,
  points,
  emptyLabel,
}: {
  title: string;
  points: Array<{ date: string; count: number }>;
  emptyLabel: string;
}) {
  const w = 420;
  const h = 160;
  const pad = { t: 16, r: 12, b: 28, l: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...points.map((p) => p.count));

  const coords = points.map((p, i) => {
    const x = pad.l + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.t + innerH - (p.count / max) * innerH;
    return { x, y, ...p };
  });

  const line =
    coords.length > 0
      ? coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ")
      : "";
  const area =
    coords.length > 0
      ? `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(pad.t + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`
      : "";

  return (
    <Card delay={1}>
      <SectionTitle title={title} />
      {points.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img">
          <defs>
            <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="volStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => {
            const y = pad.t + innerH * (1 - f);
            return (
              <line
                key={f}
                x1={pad.l}
                x2={w - pad.r}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}
          <path d={area} fill="url(#volFill)" />
          <path d={line} fill="none" stroke="url(#volStroke)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c) => (
            <g key={c.date}>
              <circle cx={c.x} cy={c.y} r={4} fill="#fff" stroke="#6366f1" strokeWidth={2} />
              <title>{`${c.date}: ${c.count}`}</title>
            </g>
          ))}
          {coords.map((c, i) =>
            i % Math.ceil(coords.length / 6) === 0 || i === coords.length - 1 ? (
              <text
                key={`lbl-${c.date}`}
                x={c.x}
                y={h - 8}
                textAnchor="middle"
                className="fill-slate-400"
                fontSize={9}
              >
                {c.date.slice(5)}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </Card>
  );
}

/** Vertical gradient columns for score buckets */
function ScoreHistogram({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; count: number }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <Card delay={2}>
      <SectionTitle title={title} subtitle={total > 0 ? `${total} sessions` : undefined} />
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">—</p>
      ) : (
        <div className="flex h-44 items-end gap-2 px-1">
          {items.map((item, idx) => {
            const pct = (item.count / max) * 100;
            return (
              <div key={item.key} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                  {item.count}
                </span>
                <div className="relative flex h-32 w-full items-end justify-center">
                  <div
                    className="w-[85%] max-w-[48px] rounded-t-xl shadow-lg transition-all duration-500 group-hover:brightness-110"
                    style={{
                      height: `${Math.max(6, pct)}%`,
                      background: `linear-gradient(180deg, ${BUCKET_COLORS[idx] ?? "#6366f1"} 0%, ${BUCKET_COLORS[idx] ?? "#6366f1"}99 100%)`,
                      boxShadow: `0 8px 24px -8px ${BUCKET_COLORS[idx] ?? "#6366f1"}88`,
                    }}
                    title={item.label}
                  />
                </div>
                <span className="w-full truncate text-center text-[9px] font-medium text-slate-500">
                  {item.key}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/** Donut chart for match labels */
function MatchDonut({
  title,
  items,
  lang,
}: {
  title: string;
  items: Array<{ key: string; count: number }>;
  lang: Lang;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 62;
  const stroke = 22;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = items.map((item) => {
    const frac = total === 0 ? 0 : item.count / total;
    const len = frac * circ;
    const seg = {
      key: item.key as MatchLabel,
      dash: `${len} ${circ - len}`,
      offset,
      count: item.count,
      frac,
    };
    offset -= len;
    return seg;
  });

  return (
    <Card delay={3}>
      <SectionTitle title={title} />
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">—</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={stroke} />
              {arcs.map((a) =>
                a.count > 0 ? (
                  <circle
                    key={a.key}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={LABEL_COLORS[a.key]}
                    strokeWidth={stroke}
                    strokeDasharray={a.dash}
                    strokeDashoffset={a.offset}
                    strokeLinecap="butt"
                    className="transition-all duration-700"
                  >
                    <title>{`${matchLabelText(lang, a.key)}: ${a.count}`}</title>
                  </circle>
                ) : null,
              )}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">{total}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">total</span>
            </div>
          </div>
          <ul className="w-full flex-1 space-y-2">
            {items.map((item) => {
              const key = item.key as MatchLabel;
              const pct = total ? Math.round((item.count / total) * 100) : 0;
              return (
                <li key={item.key} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900"
                    style={{ backgroundColor: LABEL_COLORS[key] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                    {matchLabelText(lang, key)}
                  </span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{item.count}</span>
                  <span className="w-8 text-right tabular-nums text-slate-400">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
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
  const specialties = [...new Map(cells.map((c) => [c.specialtyCode, c.specialtyTitle])).entries()];
  const max = Math.max(1, ...cells.map((c) => c.count));
  const lookup = new Map(cells.map((c) => [`${c.bacStream}|${c.specialtyCode}`, c.count]));

  return (
    <Card delay={4} className="overflow-hidden">
      <SectionTitle title={title} subtitle="Rank-1 heat intensity" />
      {cells.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto pb-1">
          <table className="min-w-full border-separate border-spacing-1 text-[10px]">
            <thead>
              <tr>
                <th className="p-1" />
                {specialties.map(([code, titleSp]) => (
                  <th
                    key={code}
                    className="max-w-[64px] truncate px-1 py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400"
                    title={titleSp}
                  >
                    {code.replace(/^HIS-?/, "").slice(0, 8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {streams.map((stream) => (
                <tr key={stream}>
                  <th className="whitespace-nowrap pr-2 text-left text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {streamLabels[stream as BacStream] ?? stream}
                  </th>
                  {specialties.map(([code]) => {
                    const count = lookup.get(`${stream}|${code}`) ?? 0;
                    const intensity = count / max;
                    return (
                      <td key={code} className="p-0">
                        <div
                          className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-transform hover:scale-105"
                          style={{
                            background:
                              count === 0
                                ? "rgba(148,163,184,0.08)"
                                : `linear-gradient(145deg, rgba(99,102,241,${0.2 + intensity * 0.75}), rgba(34,211,238,${0.15 + intensity * 0.55}))`,
                            color: intensity > 0.45 ? "#fff" : undefined,
                            boxShadow:
                              count > 0
                                ? `0 4px 14px -6px rgba(99,102,241,${0.3 + intensity * 0.5})`
                                : undefined,
                          }}
                          title={`${stream} → ${code}: ${count}`}
                        >
                          {count || "·"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-400">
            <span>Low</span>
            <div className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.15), rgba(34,211,238,0.9))" }} />
            <span>High</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export function AnalyticsDashboardPanel({ dashboard, lang, totalSessions }: Props) {
  const t = strings[lang];
  const dq = dashboard.dataQuality;

  const kpi = useMemo(
    () => [
      {
        label: t.totalSessions,
        value: totalSessions ?? dashboard.volumeByDay.reduce((s, p) => s + p.count, 0),
        hint: "sessions",
        tone: "primary" as const,
      },
      {
        label: t.avgFinalScore,
        value: dq.averageFinalScore != null ? `${dq.averageFinalScore}%` : "—",
        hint: "fit",
        tone: "cyan" as const,
      },
      {
        label: t.avgBac,
        value: dq.averageOverallBac != null ? dq.averageOverallBac.toFixed(2) : "—",
        hint: "/20",
        tone: "violet" as const,
      },
      {
        label: t.highScores,
        value: dq.highScoreSessions,
        hint: "≥ 90",
        tone: "emerald" as const,
      },
    ],
    [dashboard.volumeByDay, dq, t, totalSessions],
  );

  return (
    <div className="analytics-mesh -mx-2 space-y-5 rounded-3xl p-2 sm:p-3">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl analytics-kpi-glow text-sm font-black text-white shadow-lg shadow-indigo-500/30">
          ◈
        </div>
        <div>
          <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
            {t.dashboardTitle}
          </h3>
          <p className="text-[11px] text-slate-500">Live aggregates · filtered view</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpi.map((k, i) => (
          <div
            key={k.label}
            className={`analytics-card analytics-rise overflow-hidden p-4 analytics-rise-delay-${i + 1}`}
          >
            <div
              className={`mb-3 h-1 w-12 rounded-full ${
                k.tone === "primary"
                  ? "bg-indigo-500"
                  : k.tone === "cyan"
                    ? "bg-cyan-400"
                    : k.tone === "violet"
                      ? "bg-violet-400"
                      : "bg-emerald-400"
              }`}
            />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k.label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">
              {k.value}
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AreaVolumeChart title={t.volumeByDay} points={dashboard.volumeByDay} emptyLabel={t.noChartData} />
        <ScoreHistogram
          title={t.scoreBuckets}
          items={dashboard.scoreBuckets.map((b) => ({
            key: b.key,
            label: b.label,
            count: b.count,
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MatchDonut title={t.byMatchLabel} items={dashboard.byMatchLabel} lang={lang} />
        <Card delay={3}>
          <SectionTitle title={t.dataQuality} />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-rose-500/10 to-orange-500/10 p-3 dark:from-rose-500/20 dark:to-orange-500/10">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
                {t.lowScores}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                {dq.lowScoreSessions}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-3 dark:from-emerald-500/20 dark:to-cyan-500/10">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                {t.highScores}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                {dq.highScoreSessions}
              </p>
            </div>
          </div>
          {dq.neverRankedSpecialtyCodes.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-slate-500">{t.neverRanked}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {dq.neverRankedSpecialtyCodes.map((s) => (
                  <li
                    key={s.code}
                    className="rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200"
                    title={s.title}
                  >
                    {s.code}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dq.sessionsMissingRiasec > 0 && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              ⚠ {t.missingRiasec}: {dq.sessionsMissingRiasec}
            </p>
          )}
        </Card>
      </div>

      <StreamSpecialtyMatrix
        title={t.streamSpecialtyMatrix}
        cells={dashboard.streamSpecialtyMatrix}
        lang={lang}
        emptyLabel={t.noChartData}
      />
    </div>
  );
}
