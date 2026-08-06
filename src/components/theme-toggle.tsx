"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasMounted, setHasMounted] = useState(false);
  const persistedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    // TalentOS starts in a bright, high-legibility workspace on every device.
    const nextTheme = stored === "dark" ? "dark" : "light";

    queueMicrotask(() => {
      setTheme(nextTheme);
      setHasMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    if (persistedRef.current) {
      localStorage.setItem("theme", theme);
    }
    persistedRef.current = true;
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
