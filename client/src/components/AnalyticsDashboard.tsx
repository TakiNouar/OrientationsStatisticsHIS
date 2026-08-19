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
      <h3 className="analytics-truncate font-display text-sm font-semibold tracking-tight text-ink">{title}</h3>
      {subtitle && (
        <p className="analytics-truncate mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          {subtitle}
        </p>
      )}
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
        <div className="analytics-kpi-glow flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-medium">
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
            <p className="mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums text-ink">{k.value}</p>
            <p className="mt-1 font-mono text-[10px] text-ink-muted">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card delay={1}>
          <SectionTitle title={t.volumeByDay} />
          {volume.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">{t.noChartData}</p>
          ) : (
            <p className="text-sm text-ink-muted">{volume.length} day(s) · {volume.reduce((s, p) => s + p.count, 0)} sessions</p>
          )}
        </Card>
        <Card delay={2}>
          <SectionTitle title={t.scoreBuckets} />
          {buckets.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">—</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {buckets.map((b) => (
                <li key={b.key} className="flex justify-between gap-2">
                  <span className="text-ink-muted">{b.label}</span>
                  <span className="font-mono tabular-nums text-ink">{b.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card delay={3}>
          <SectionTitle title={t.byMatchLabel} />
          {labels.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">—</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {labels.map((item) => (
                <li key={item.key} className="flex justify-between gap-2">
                  <span className="text-ink-muted">{matchLabelText(lang, item.key as MatchLabel)}</span>
                  <span className="font-mono tabular-nums text-ink">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card delay={3}>
          <SectionTitle title={t.dataQuality} />
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 border border-burgundy/30 bg-burgundy/5 p-3">
              <p className="analytics-truncate font-mono text-[10px] font-medium uppercase tracking-wide text-burgundy">
                {t.lowScores}
              </p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">{dq.lowScoreSessions ?? 0}</p>
            </div>
            <div className="min-w-0 border border-brass-dim bg-brass/5 p-3">
              <p className="analytics-truncate font-mono text-[10px] font-medium uppercase tracking-wide text-brass">
                {t.highScores}
              </p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-ink">{dq.highScoreSessions ?? 0}</p>
            </div>
          </div>
          {(dq.sessionsMissingRiasec ?? 0) > 0 && (
            <p className="mt-3 break-words border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-xs text-burgundy">
              {t.missingRiasec}: {dq.sessionsMissingRiasec}
            </p>
          )}
        </Card>
      </div>

      <Card delay={4}>
        <SectionTitle title={t.streamSpecialtyMatrix} subtitle="Rank-1 heat intensity" />
        {matrix.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">{t.noChartData}</p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {matrix.map((c) => (
              <li key={`${c.bacStream}-${c.specialtyCode}`} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-ink-muted">
                  {STREAM_LABELS_I18N[lang][c.bacStream as BacStream] ?? c.bacStream} → {c.specialtyTitle}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-ink">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
