export type ThemeMode = "light" | "dark" | "system";

/** Alias used by App.tsx (light | dark only for toggle UI). */
export type Theme = "light" | "dark";

const STORAGE_KEY = "his-sre-theme";

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // ignore
  }
  return "system";
}

export function storeTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function resolveDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Apply `dark` class on <html> for Tailwind class strategy. */
export function applyThemeClass(mode: ThemeMode): void {
  const root = document.documentElement;
  if (resolveDark(mode)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/** Load initial theme for App (maps system → current resolved light/dark). */
export function loadTheme(): Theme {
  const mode = getStoredTheme();
  applyThemeClass(mode);
  return resolveDark(mode) ? "dark" : "light";
}

/** Toggle between light and dark; persists preference. */
export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === "dark" ? "light" : "dark";
  storeTheme(next);
  applyThemeClass(next);
  return next;
}

/** Load the raw three-way mode (system/light/dark) for UI that shows all three. */
export function loadThemeMode(): ThemeMode {
  const mode = getStoredTheme();
  applyThemeClass(mode);
  return mode;
}

/** Cycle system → light → dark → system; persists and applies each step. */
export function cycleThemeMode(current: ThemeMode): ThemeMode {
  const order: ThemeMode[] = ["system", "light", "dark"];
  const next = order[(order.indexOf(current) + 1) % order.length] ?? "system";
  storeTheme(next);
  applyThemeClass(next);
  return next;
}
