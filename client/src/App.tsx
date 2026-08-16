import { useCallback, useEffect, useState } from "react";
import { Step1AcademicForm } from "./components/Step1AcademicForm";
import { Step2RiasecForm } from "./components/Step2RiasecForm";
import { Step3Results } from "./components/Step3Results";
import { StepIndicator } from "./components/StepIndicator";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { useRecommendationWizard } from "./hooks/useRecommendationWizard";
import { fetchConfig } from "./lib/api";
import { loadTheme, toggleTheme, type Theme } from "./lib/theme";
import type { ConfigResponse, TopRiasecProfile } from "./types";
import { strings, type Lang } from "./i18n/strings";

type Route = "wizard" | "analytics";

function useHashRoute(): [Route, (r: Route) => void] {
  const parse = (): Route =>
    window.location.hash.replace("#", "") === "analytics" ? "analytics" : "wizard";
  const [route, setRouteState] = useState<Route>(parse);
  useEffect(() => {
    const onHash = () => setRouteState(parse());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const setRoute = useCallback((r: Route) => {
    window.location.hash = r === "analytics" ? "analytics" : "";
    setRouteState(r);
  }, []);
  return [route, setRoute];
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("his-sre-lang");
    return saved === "en" || saved === "fr" ? saved : "fr";
  });
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [route, setRoute] = useHashRoute();

  const t = strings[lang];
  const wizard = useRecommendationWizard(config, lang);

  useEffect(() => {
    localStorage.setItem("his-sre-lang", lang);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConfigLoading(true);
      setConfigError(null);
      try {
        const cfg = await fetchConfig();
        if (!cancelled) setConfig(cfg);
      } catch (e) {
        if (!cancelled) {
          setConfigError(e instanceof Error ? e.message : "Config load failed");
        }
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggleTheme = () => setTheme(toggleTheme(theme));

  if (configLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">{t.loadingConfig}</p>
      </div>
    );
  }

  if (configError || !config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 dark:bg-slate-950">
        <p className="text-red-600 dark:text-red-400">{configError ?? t.configError}</p>
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
          onClick={() => window.location.reload()}
        >
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">{t.appTitle}</h1>
            <p className="text-xs text-slate-500">{t.appSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-sm ${
                route === "wizard"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
              onClick={() => setRoute("wizard")}
            >
              {t.navWizard}
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-sm ${
                route === "analytics"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
              onClick={() => setRoute("analytics")}
            >
              {t.navAnalytics}
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-800"
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            >
              {lang === "fr" ? "EN" : "FR"}
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-800"
              onClick={onToggleTheme}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {route === "analytics" ? (
          <AnalyticsPage config={config} lang={lang} onBack={() => setRoute("wizard")} />
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">{t.disclaimer}</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <StepIndicator step={wizard.step} lang={lang} onGoToStep={wizard.goToStep} />

              {wizard.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  <p className="font-medium">{wizard.error}</p>
                  {Object.keys(wizard.fieldErrors).length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {Object.values(wizard.fieldErrors)
                        .filter(Boolean)
                        .map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                    </ul>
                  )}
                </div>
              )}

              {wizard.step === 1 && (
                <Step1AcademicForm
                  config={config}
                  form={wizard.form}
                  lang={lang}
                  fieldErrors={wizard.fieldErrors}
                  disabled={wizard.loading}
                  onFullName={wizard.setFullName}
                  onBacStream={wizard.setBacStream}
                  onPreferredSpecialty={wizard.setPreferredSpecialtyCode}
                  onTechnicalOption={wizard.setTechnicalOption}
                  onOverallBacMark={wizard.setOverallBacMark}
                  onGrade={wizard.setGrade}
                />
              )}

              {wizard.step === 2 && (
                <Step2RiasecForm
                  config={config}
                  form={wizard.form}
                  availableLetters={wizard.availableLetters}
                  lang={lang}
                  fieldErrors={wizard.fieldErrors}
                  disabled={wizard.loading}
                  onSlotChange={wizard.setTopRiasecSlot}
                />
              )}

              {wizard.step === 3 && wizard.result && (
                <Step3Results
                  result={wizard.result}
                  topRiasec={wizard.form.topRiasec as TopRiasecProfile}
                  onReset={wizard.reset}
                  lang={lang}
                  genieLabels={config.technicalMathOptionLabels}
                />
              )}

              {wizard.step !== 3 && (
                <div className="mt-6 flex justify-between gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
                    onClick={wizard.goBack}
                    disabled={wizard.step === 1 || wizard.loading}
                  >
                    {t.back}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    onClick={wizard.goNext}
                    disabled={wizard.loading}
                  >
                    {wizard.loading
                      ? t.calculating
                      : wizard.step === 2
                        ? t.calculate
                        : t.next}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
