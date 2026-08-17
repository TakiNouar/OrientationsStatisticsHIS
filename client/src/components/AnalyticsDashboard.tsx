import { useMemo, type ReactNode } from "react";
import type { AnalyticsDashboard, BacStream, MatchLabel } from "../types";
import type { Lang } from "../i18n/strings";
import { STREAM_LABELS_I18N, matchLabelText, strings } from "../i18n/strings";

type Props = {
  dashboard: AnalyticsDashboard;
  lang: Lang;
  totalSessions?: number;
};

const LABEL_COLORS: Record<MatchLabel, string> = {
  STRONG_MATCH: "#A9852F",
  STRONG_MATCH_CONVERSATION: "#C7A346",
  POSSIBLE_FIT: "#D9C68C",
  PROFILE_DEVELOPING: "#8C8168",
  WEAK_MATCH: "#6E1F2A",
};

const BUCKET_COLORS = ["#8C8168", "#D9C68C", "#C7A346", "#A9852F", "#6E1F2A"];

function Card({ children, className = "", delay }: { children: ReactNode; className?: string; delay?: number }) {
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
  return (
    <div className={`analytics-card analytics-rise min-w-0 p-4 sm:p-5 ${delayClass} ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 min-w-0">
      <h3 className="analytics-truncate text-sm font-bold tracking-tight text-slate-900 dark:text-sky-50">
        {title}
      </h3>
      {subtitle && (
        <p className="analytics-truncate mt-0.5 text-[11px] text-slate-600 dark:text-sky-200/70">
          {subtitle}
        </p>
      )}
    </div>
  );
}

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
        <p className="py-10 text-center text-sm text-slate-500 dark:text-sky-300/60">{emptyLabel}</p>
      ) : (
        <div className="w-full min-w-0 overflow-hidden">
          <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full max-w-full sm:h-44" role="img">
            <defs>
              <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="volStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="55%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#38bdf8" />
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
                  stroke="#7dd3fc"
                  strokeOpacity={0.45}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              );
            })}
            <path d={area} fill="url(#volFill)" />
            <path
              d={line}
              fill="none"
              stroke="url(#volStroke)"
              strokeWidth={2.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {coords.map((c) => (
              <g key={c.date}>
                <circle cx={c.x} cy={c.y} r={4.5} fill="#fff" stroke="#0284c7" strokeWidth={2.25} />
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
                  fill="#334155"
                  fontSize={9}
                >
                  {c.date.slice(5)}
                </text>
              ) : null,
            )}
          </svg>
        </div>
      )}
    </Card>
  );
}

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
        <p className="py-10 text-center text-sm text-slate-500">—</p>
      ) : (
        <div className="flex h-40 min-w-0 items-end gap-1.5 overflow-hidden px-0.5 sm:h-44 sm:gap-2">
          {items.map((item, idx) => {
            const pct = (item.count / max) * 100;
            const color = BUCKET_COLORS[idx] ?? "#0ea5e9";
            return (
              <div key={item.key} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold tabular-nums text-slate-800 dark:text-sky-100 sm:text-[11px]">
                  {item.count}
                </span>
                <div className="relative flex h-28 w-full items-end justify-center sm:h-32">
                  <div
                    className="w-[80%] max-w-[44px] rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                    style={{
                      height: `${Math.max(6, pct)}%`,
                      background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
                      boxShadow: `0 10px 22px -8px ${color}99`,
                    }}
                    title={item.label}
                  />
                </div>
                <span className="analytics-truncate w-full text-center text-[8px] font-semibold text-slate-600 dark:text-sky-200/80 sm:text-[9px]">
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
  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const r = 58;
  const stroke = 20;
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
    };
    offset -= len;
    return seg;
  });

  return (
    <Card delay={3}>
      <SectionTitle title={title} />
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">—</p>
      ) : (
        <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#bae6fd" strokeWidth={stroke} />
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
                    className="transition-all duration-700"
                  >
                    <title>{`${matchLabelText(lang, a.key)}: ${a.count}`}</title>
                  </circle>
                ) : null,
              )}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">{total}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-sky-300/70">
                total
              </span>
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-2 overflow-hidden">
            {items.map((item) => {
              const key = item.key as MatchLabel;
              const pct = total ? Math.round((item.count / total) * 100) : 0;
              return (
                <li key={item.key} className="flex min-w-0 items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-sky-100 dark:ring-slate-900"
                    style={{ backgroundColor: LABEL_COLORS[key] }}
                  />
                  <span className="analytics-truncate min-w-0 flex-1 font-medium text-slate-700 dark:text-sky-100">
                    {matchLabelText(lang, key)}
                  </span>
                  <span className="shrink-0 font-bold tabular-nums text-slate-900 dark:text-white">
                    {item.count}
                  </span>
                  <span className="w-8 shrink-0 text-right tabular-nums text-slate-500">{pct}%</span>
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
    <Card delay={4}>
      <SectionTitle title={title} subtitle="Rank-1 heat intensity" />
      {cells.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="min-w-0 overflow-x-auto pb-1">
          <table className="w-max min-w-full border-separate border-spacing-1 text-[10px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-sky-50 p-1 dark:bg-slate-900" />
                {specialties.map(([code, titleSp]) => (
                  <th
                    key={code}
                    className="max-w-[4.5rem] px-1 py-1 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600 dark:text-sky-200/80"
                    title={titleSp}
                  >
                    <span className="analytics-truncate block max-w-[4.5rem]">
                      {code.replace(/^HIS-?/, "").slice(0, 8)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {streams.map((stream) => (
                <tr key={stream}>
                  <th className="sticky left-0 z-10 max-w-[7rem] bg-sky-50 pr-2 text-left text-[10px] font-bold text-slate-700 dark:bg-slate-900 dark:text-sky-100">
                    <span className="analytics-truncate block max-w-[7rem]">
                      {streamLabels[stream as BacStream] ?? stream}
                    </span>
                  </th>
                  {specialties.map(([code]) => {
                    const count = lookup.get(`${stream}|${code}`) ?? 0;
                    const intensity = count / max;
                    return (
                      <td key={code} className="p-0">
                        <div
                          className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-[11px] font-bold tabular-nums"
                          style={{
                            background:
                              count === 0
                                ? "rgba(125, 211, 252, 0.2)"
                                : `linear-gradient(145deg, rgba(2,132,199,${0.3 + intensity * 0.65}), rgba(56,189,248,${0.25 + intensity * 0.5}))`,
                            color: intensity > 0.35 ? "#fff" : "#0f172a",
                            boxShadow:
                              count > 0
                                ? `0 4px 14px -6px rgba(2,132,199,${0.35 + intensity * 0.4})`
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
          <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-600 dark:text-sky-200/70">
            <span>Low</span>
            <div
              className="h-2 w-24 shrink-0 rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(125,211,252,0.35), #0284c7)" }}
            />
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
        bar: "bg-sky-500",
      },
      {
        label: t.avgFinalScore,
        value: dq.averageFinalScore != null ? `${dq.averageFinalScore}%` : "—",
        hint: "fit",
        bar: "bg-cyan-500",
      },
      {
        label: t.avgBac,
        value: dq.averageOverallBac != null ? dq.averageOverallBac.toFixed(2) : "—",
        hint: "/20",
        bar: "bg-blue-500",
      },
      {
        label: t.highScores,
        value: dq.highScoreSessions,
        hint: "≥ 90",
        bar: "bg-emerald-500",
      },
    ],
    [dashboard.volumeByDay, dq, t, totalSessions],
  );

  return (
    <div className="analytics-mesh -mx-1 min-w-0 space-y-5 overflow-hidden rounded-3xl p-2 sm:-mx-2 sm:p-3">
      <div className="flex min-w-0 items-center gap-3 px-1">
        <div className="analytics-kpi-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg shadow-sky-500/35">
          ◈
        </div>
        <div className="min-w-0">
          <h3 className="analytics-truncate text-base font-black tracking-tight text-slate-900 dark:text-sky-50">
            {t.dashboardTitle}
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-sky-200/70">Live aggregates · filtered view</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpi.map((k, i) => (
          <div
            key={k.label}
            className={`analytics-card analytics-rise min-w-0 overflow-hidden p-4 analytics-rise-delay-${i + 1}`}
          >
            <div className={`mb-3 h-1.5 w-12 rounded-full ${k.bar}`} />
            <p className="analytics-truncate text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-sky-200/80">
              {k.label}
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 tabular-nums dark:text-white">
              {k.value}
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-sky-300/60">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
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

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <MatchDonut title={t.byMatchLabel} items={dashboard.byMatchLabel} lang={lang} />
        <Card delay={3}>
          <SectionTitle title={t.dataQuality} />
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-2xl bg-gradient-to-br from-orange-400/20 to-rose-400/15 p-3">
              <p className="analytics-truncate text-[10px] font-semibold uppercase tracking-wide text-orange-800 dark:text-orange-200">
                {t.lowScores}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                {dq.lowScoreSessions}
              </p>
            </div>
            <div className="min-w-0 rounded-2xl bg-gradient-to-br from-sky-400/25 to-cyan-400/15 p-3">
              <p className="analytics-truncate text-[10px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
                {t.highScores}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                {dq.highScoreSessions}
              </p>
            </div>
          </div>
          {dq.neverRankedSpecialtyCodes.length > 0 && (
            <div className="mt-4 min-w-0">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-sky-200/80">{t.neverRanked}</p>
              <ul className="mt-2 flex max-w-full flex-wrap gap-1.5">
                {dq.neverRankedSpecialtyCodes.map((s) => (
                  <li
                    key={s.code}
                    className="max-w-full rounded-full border border-sky-300/80 bg-sky-100 px-2.5 py-1 text-[10px] font-semibold text-sky-900 dark:border-sky-700/50 dark:bg-sky-950/40 dark:text-sky-100"
                    title={s.title}
                  >
                    <span className="analytics-truncate inline-block max-w-[10rem]">{s.code}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dq.sessionsMissingRiasec > 0 && (
            <p className="mt-3 break-words rounded-xl bg-orange-50 px-3 py-2 text-xs font-medium text-orange-900 dark:bg-orange-950/30 dark:text-orange-200">
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
