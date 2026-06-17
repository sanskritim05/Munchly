"use client";

import { THEME_OPTIONS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">Appearance</label>
      <div className="flex rounded-full border border-border bg-surface p-1">
        {THEME_OPTIONS.map(({ id, label }) => {
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`flex-1 rounded-full py-2.5 text-center text-sm transition-colors ${
                active
                  ? "bg-hot font-bold text-white"
                  : "font-normal text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
