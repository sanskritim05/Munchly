"use client";

import { motion } from "framer-motion";
import { THEME_OPTIONS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">Appearance</label>
      <div className="relative flex rounded-full border border-border bg-surface p-1">
        {THEME_OPTIONS.map(({ id, label }) => {
          const active = theme === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`relative flex-1 rounded-full py-2.5 text-center text-sm ${
                active ? "font-bold text-white" : "font-normal text-gray-500 hover:text-gray-300"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="appearance-toggle"
                  className="absolute inset-0 rounded-full bg-hot"
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
