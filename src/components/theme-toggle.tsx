"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchMyPreferences, updateMyPreference } from "@/lib/backend";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // TalentOS starts in a bright, high-legibility workspace on every device.
    void fetchMyPreferences()
      .then((preferences) => {
        if (cancelled) return;
        const stored = preferences["ui-theme"] as { theme?: "light" | "dark" } | undefined;
        setTheme(stored?.theme === "dark" ? "dark" : "light");
        setHasMounted(true);
      })
      .catch(() => {
        if (cancelled) return;
        setTheme(window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        setHasMounted(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    void updateMyPreference("ui-theme", { theme }).catch(() => undefined);
  }, [hasMounted, theme]);

  function toggle() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggle}
      className={className}
      disabled={!hasMounted}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
