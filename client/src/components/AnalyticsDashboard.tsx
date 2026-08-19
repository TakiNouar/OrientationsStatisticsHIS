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

function Card({
  children,
  className = "",
  delay,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
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
      <h3 className="analytics-truncate font-display text-sm font-semibold tracking-tight text-ink">
        {title}
      </h3>
      {subtitle && (
        <p className="analytics-truncate mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function HBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(4, (count / max) * 100) : 0;
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="analytics-truncate min-w-0 text-ink-muted">{label}</span>
        <span className="shrink-0 font-mono tabular-nums text-ink">{count}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-brass-dim/30">
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function AnalyticsDashboardPanel({ dashboard, lang, totalSessions }: Props) {
  const t = strings[lang];
  if (!dashboard) return null;

  const dq = dashboard.dataQuality ?? {
    neverRankedSpecialtyCodes: [] as Array<{ code: string; title: string }>,
    highScoreSessions: 0,
    lowScoreSessions: 0,
    averageFinalScore: null as number | null,
    averageOverallBac: null as number | null,
    sessionsMissingRiasec: 0,
  };

  const volume = dashboard.volumeByDay ?? [];
  const buckets = dashboard.scoreBuckets ?? [];
  const labels = dashboard.byMatchLabel ?? [];
  const matrix = dashboard.streamSpecialtyMatrix ?? [];
  const streamLabels = STREAM_LABELS_I18N[lang];

  const volumeMax = Math.max(1, ...volume.map((p) => p.count));
  const bucketMax = Math.max(1, ...buckets.map((b) => b.count));
  const labelMax = Math.max(1, ...labels.map((l) => l.count));
  const matrixMax = Math.max(1, ...matrix.map((c) => c.count));

  const kpi = useMemo(
    () => [
      {
        label: t.totalSessions,
        value: totalSessions ?? volume.reduce((s, p) => s + p.count, 0),
        hint: "sessions",
      },
      {
        label: t.avgFinalScore,
        value: dq.averageFinalScore != null ? `${dq.averageFinalScore}%` : "—",
        hint: "fit",
      },
      {
        label: t.avgBac,
        value: dq.averageOverallBac != null ? dq.averageOverallBac.toFixed(2) : "—",
        hint: "/20",
      },
      {
        label: t.highScores,
        value: dq.highScoreSessions ?? 0,
        hint: "≥ 90",
      },
    ],
    [volume, dq, t, totalSessions],
  );

  return (
    <div className="min-w-0 space-y-5 overflow-hidden">
      <div className="flex min-w-0 items-center gap-3">
        <div className="analytics-kpi-glow flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-medium text-brass">
          ◈
        </div>
        <div className="min-w-0">
          <h3 className="analytics-truncate font-display text-base font-semibold tracking-tight text-ink">
            {t.dashboardTitle}
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Live aggregates · filtered view
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpi.map((k, i) => (
          <div
            key={k.label}
            className={`analytics-card analytics-rise min-w-0 overflow-hidden p-4 analytics-rise-delay-${i + 1}`}
          >
            <div className="mb-3 h-0.5 w-10 bg-brass" />
            <p className="analytics-truncate font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
              {k.label}
            </p>
            <p className="mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums text-ink">
              {k.value}
            </p>
            <p className="mt-1 font-mono text-[10px] text-ink-muted">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card delay={1}>
          <SectionTitle title={t.volumeByDay} />
          {volume.length === 0 ? (
            <p className="intended-empty">{t.noChartData}</p>
          ) : (
            <div className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
              {volume.map((p) => (
                <HBar key={p.date} label={p.date} count={p.count} max={volumeMax} color="#A9852F" />
              ))}
            </div>
          )}
        </Card>
        <Card delay={2}>
          <SectionTitle title={t.scoreBuckets} />
          {buckets.length === 0 ? (
            <p className="intended-empty">—</p>
          ) : (
            <div className="space-y-2.5">
              {buckets.map((b, idx) => (
                <HBar
                  key={b.key}
                  label={b.label}
                  count={b.count}
                  max={bucketMax}
                  color={["#8C8168", "#D9C68C", "#C7A346", "#A9852F", "#6E1F2A"][idx] ?? "#A9852F"}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card delay={3}>
          <SectionTitle title={t.byMatchLabel} />
          {labels.length === 0 ? (
            <p className="intended-empty">—</p>
          ) : (
            <div className="space-y-2.5">
              {labels.map((item) => (
                <HBar
                  key={item.key}
                  label={matchLabelText(lang, item.key as MatchLabel)}
                  count={item.count}
                  max={labelMax}
                  color={LABEL_COLORS[item.key as MatchLabel] ?? "#A9852F"}
                />
              ))}
            </div>
          )}
        </Card>
        <Card delay={3}>
          <SectionTitle title={t.dataQuality} />
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 border border-burgundy/30 bg-burgundy/5 p-3">
              <p className="analytics-truncate font-mono text-[10px] font-medium uppercase tracking-wide text-burgundy">
                {t.lowScores}
              </p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
                {dq.lowScoreSessions ?? 0}
              </p>
            </div>
            <div className="min-w-0 border border-brass-dim bg-brass/5 p-3">
              <p className="analytics-truncate font-mono text-[10px] font-medium uppercase tracking-wide text-brass">
                {t.highScores}
              </p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">
                {dq.highScoreSessions ?? 0}
              </p>
            </div>
          </div>
          {(dq.sessionsMissingRiasec ?? 0) > 0 && (
            <p className="mt-3 break-words border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-xs text-burgundy">
              {t.missingRiasec}: {dq.sessionsMissingRiasec}
            </p>
          )}
          {(dq.neverRankedSpecialtyCodes?.length ?? 0) > 0 && (
            <div className="mt-4 min-w-0">
              <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                {t.neverRanked}
              </p>
              <ul className="mt-2 flex max-w-full flex-wrap gap-1.5">
                {(dq.neverRankedSpecialtyCodes ?? []).map((s) => {
                  const code = typeof s === "string" ? s : s.code;
                  const title = typeof s === "string" ? s : s.title ?? s.code;
                  return (
                    <li
                      key={code}
                      className="max-w-full rounded-sm border border-brass-dim bg-surface px-2 py-0.5 font-mono text-[10px] text-ink"
                      title={title}
                    >
                      <span className="analytics-truncate inline-block max-w-[10rem]">{code}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <Card delay={4}>
        <SectionTitle title={t.streamSpecialtyMatrix} subtitle="Rank-1 heat intensity" />
        {matrix.length === 0 ? (
          <p className="intended-empty">{t.noChartData}</p>
        ) : (
          <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {matrix.map((c) => (
              <HBar
                key={`${c.bacStream}-${c.specialtyCode}`}
                label={`${streamLabels[c.bacStream as BacStream] ?? c.bacStream} → ${c.specialtyTitle}`}
                count={c.count}
                max={matrixMax}
                color="#A9852F"
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
