import { useCallback, useEffect, useState } from "react";
import {
  exportEvaluationsUrl,
  fetchAnalyticsRecent,
  fetchAnalyticsSummary,
} from "../lib/api";
import type {
  AnalyticsRecentResponse,
  AnalyticsSummary,
  BacStream,
  ConfigResponse,
  MatchLabel,
} from "../types";
import { LABEL_STYLES } from "../types";
import type { Lang } from "../i18n/strings";
import { STREAM_LABELS_I18N, matchLabelText, strings } from "../i18n/strings";

type Props = {
  config: ConfigResponse;
  lang: Lang;
  onBack: () => void;
};

type Filters = {
  from: string;
  to: string;
  bacStream: BacStream | "";
  specialtyCode: string;
};

const emptyFilters = (): Filters => ({
  from: "",
  to: "",
  bacStream: "",
  specialtyCode: "",
});

function CountList({
  title,
  rows,
  labelFn,
}: {
  title: string;
  rows: Array<{ key: string; label: string; count: number }>;
  labelFn?: (key: string, label: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">—</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.key} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {labelFn ? labelFn(row.key, row.label) : row.label}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                  {row.count}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AnalyticsPage({ config, lang, onBack }: Props) {
  const t = strings[lang];
  const streamLabels = STREAM_LABELS_I18N[lang];
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recent, setRecent] = useState<AnalyticsRecentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    const params = {
      from: f.from || undefined,
      to: f.to || undefined,
      bacStream: f.bacStream || undefined,
      specialtyCode: f.specialtyCode || undefined,
      limit: 50,
    };
    try {
      const [s, r] = await Promise.all([
        fetchAnalyticsSummary(params),
        fetchAnalyticsRecent(params),
      ]);
      setSummary(s);
      setRecent(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.analyticsError);
    } finally {
      setLoading(false);
    }
  }, [t.analyticsError]);

  useEffect(() => {
    void load(applied);
  }, [applied, load]);

  const applyFilters = () => setApplied({ ...filters });
  const resetFilters = () => {
    const empty = emptyFilters();
    setFilters(empty);
    setApplied(empty);
  };

  const exportUrl = exportEvaluationsUrl({
    from: applied.from || undefined,
    to: applied.to || undefined,
    bacStream: applied.bacStream || undefined,
    specialtyCode: applied.specialtyCode || undefined,
    anonymized: true,
  });

  const specialties = config.specialties ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t.analyticsTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t.analyticsSubtitle}</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t.analyticsAnonNote}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t.backToWizard}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {t.filterFrom}
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {t.filterTo}
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {t.filterStream}
            <select
              value={filters.bacStream}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  bacStream: e.target.value as BacStream | "",
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">{t.filterAll}</option>
              {config.bacStreams.map((s) => (
                <option key={s} value={s}>
                  {streamLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {t.filterSpecialty}
            <select
              value={filters.specialtyCode}
              onChange={(e) => setFilters((p) => ({ ...p, specialtyCode: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">{t.filterAll}</option>
              {specialties.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {t.applyFilters}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-200"
          >
            {t.resetFilters}
          </button>
          <a
            href={exportUrl}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-200"
          >
            {t.exportAnonymizedCsv}
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => void load(applied)}>
            {t.retry}
          </button>
        </div>
      )}

      {loading && !summary && (
        <p className="text-sm text-slate-500">{t.analyticsLoading}</p>
      )}

      {summary && (
        <>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              {t.totalSessions}
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-indigo-700 dark:text-indigo-200">
              {summary.totalSessions}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <CountList
              title={t.byStream}
              rows={summary.byStream}
              labelFn={(key) => streamLabels[key as BacStream] ?? key}
            />
            <CountList title={t.byTopSpecialty} rows={summary.byTopSpecialty} />
            <CountList
              title={t.byMatchLabel}
              rows={summary.byMatchLabel}
              labelFn={(key) => matchLabelText(lang, key as MatchLabel)}
            />
          </div>
        </>
      )}

      {recent && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.recentSessions}
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                <tr>
                  <th className="px-2 py-2 font-medium">{t.colSession}</th>
                  <th className="px-2 py-2 font-medium">{t.colDate}</th>
                  <th className="px-2 py-2 font-medium">{t.colStream}</th>
                  <th className="px-2 py-2 font-medium">{t.colTopSpecialty}</th>
                  <th className="px-2 py-2 font-medium">{t.colScore}</th>
                  <th className="px-2 py-2 font-medium">{t.colLabel}</th>
                </tr>
              </thead>
              <tbody>
                {recent.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-slate-500">
                      {t.noSessions}
                    </td>
                  </tr>
                ) : (
                  recent.rows.map((row) => (
                    <tr
                      key={`${row.sessionRef}-${row.evaluatedAt}`}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-2 py-2 font-mono text-slate-600 dark:text-slate-300">
                        {row.sessionRef}
                      </td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                        {row.evaluatedAt?.slice(0, 19).replace("T", " ")}
                      </td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-200">
                        {streamLabels[row.bacStream as BacStream] ?? row.bacStream}
                      </td>
                      <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                        {row.topSpecialtyTitle}
                      </td>
                      <td className="px-2 py-2 font-semibold tabular-nums">
                        {row.finalScore.toFixed(1)}%
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            LABEL_STYLES[row.matchLabel]
                          }`}
                        >
                          {matchLabelText(lang, row.matchLabel)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
