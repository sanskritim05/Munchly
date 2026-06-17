export type Theme = "dark" | "light" | "system";

export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "platecheck_theme";

export const THEME_OPTIONS: { id: Theme; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "system", label: "System" },
];

const THEME_IDS = new Set<string>(THEME_OPTIONS.map((t) => t.id));

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && THEME_IDS.has(stored)) return stored as Theme;
  return "dark";
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme);

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-appearance", resolved);
    document.documentElement.style.colorScheme = resolved;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", resolved === "light" ? "#ffffff" : "#000000");
    }
  }

  return resolved;
}

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var valid=${JSON.stringify(THEME_OPTIONS.map((t) => t.id))};var s=localStorage.getItem(k)||"dark";if(valid.indexOf(s)===-1)s="dark";var r=s==="system"?(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):s;document.documentElement.setAttribute("data-theme",r);document.documentElement.setAttribute("data-appearance",r);document.documentElement.style.colorScheme=r;}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.setAttribute("data-appearance","dark");}})();`;
