"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchMyPreferences, updateMyPreference } from "@/lib/backend";

/**
 * Apariencia del espacio de trabajo: tema y densidad.
 *
 * Por qué un proveedor y no dos componentes sueltos
 * -------------------------------------------------
 * Antes `ThemeToggle` hacía su propio `fetchMyPreferences()` al montar. Añadir
 * la densidad como segundo componente independiente habría duplicado esa misma
 * petición en cada carga de pantalla. Aquí se lee UNA vez y ambos controles
 * consumen el resultado.
 *
 * Por qué hay un espejo en `localStorage`
 * ---------------------------------------
 * La preferencia vive en el backend, que sigue siendo la fuente de verdad y lo
 * que sincroniza el ajuste entre los dispositivos del usuario. Pero llega por
 * red DESPUÉS del primer pintado, así que sin nada más el usuario ve un
 * fogonazo claro antes de que se aplique su tema oscuro, y un salto de tamaños
 * al pasar a densidad compacta. El espejo local es solo una pista de pintado:
 * lo lee el script de arranque de `layout.tsx` para acertar el primer frame. Si
 * no está, está corrupto o el navegador lo bloquea, no pasa nada: se pinta el
 * valor por defecto y la respuesta del backend corrige.
 */

export type Theme = "light" | "dark";

/**
 * `comfortable` es la escala accesible acordada: cuerpo de 17-18px y objetivos
 * de 56px, para que el producto siga siendo usable por alguien sin experiencia
 * informática. `compact` es el registro profesional, con más información por
 * pantalla. En ninguna de las dos el objetivo táctil en móvil baja de 44px.
 */
export type Density = "comfortable" | "compact";

type AppearanceValue = {
  theme: Theme;
  density: Density;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  /** `false` hasta que se conoce la preferencia real; los controles se inhabilitan. */
  ready: boolean;
};

const AppearanceContext = createContext<AppearanceValue | null>(null);

export const APPEARANCE_STORAGE_KEY = "talentos.appearance";

function readMirror(): Partial<{ theme: Theme; density: Density }> {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<{ theme: Theme; density: Density }>;
    return {
      theme: parsed.theme === "dark" ? "dark" : parsed.theme === "light" ? "light" : undefined,
      density: parsed.density === "compact" ? "compact" : parsed.density === "comfortable" ? "comfortable" : undefined,
    };
  } catch {
    return {};
  }
}

function writeMirror(theme: Theme, density: Density) {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme, density }));
  } catch {
    /* Modo privado o almacenamiento bloqueado: la preferencia del backend basta. */
  }
}

/**
 * Valor inicial tomado del espejo local.
 *
 * Se lee en el inicializador perezoso de `useState` y NO en un efecto. Hacerlo
 * en un efecto significaba pintar una vez con el valor por defecto y volver a
 * pintar con el real: un render en cascada que además ESLint marca como error
 * (`react-hooks/set-state-in-effect`).
 *
 * En el servidor no hay `window`, así que allí devuelve el valor por defecto.
 * Eso haría que el primer render del cliente y el del servidor discrepasen, y
 * por eso los controles que dependen del tema no lo muestran hasta que `ready`
 * es cierto: `ready` vale `false` en los dos lados, de modo que el marcado que
 * se hidrata es idéntico. El tema visible ya es el correcto desde el primer
 * frame porque lo aplica `APPEARANCE_BOOT_SCRIPT` sobre el DOM.
 */
function initialAppearance(): { theme: Theme; density: Density } {
  if (typeof window === "undefined") return { theme: "light", density: "comfortable" };
  const mirror = readMirror();
  return { theme: mirror.theme ?? "light", density: mirror.density ?? "comfortable" };
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => initialAppearance().theme);
  const [density, setDensityState] = useState<Density>(() => initialAppearance().density);
  const [ready, setReady] = useState(false);

  // Valor real: el backend. Corrige el espejo si difieren.
  useEffect(() => {
    let cancelled = false;
    void fetchMyPreferences()
      .then((preferences) => {
        if (cancelled) return;
        const storedTheme = (preferences["ui-theme"] as { theme?: Theme } | undefined)?.theme;
        const storedDensity = (preferences["ui-density"] as { density?: Density } | undefined)?.density;
        if (storedTheme === "dark" || storedTheme === "light") setThemeState(storedTheme);
        if (storedDensity === "compact" || storedDensity === "comfortable") setDensityState(storedDensity);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Sin preferencia guardada se respeta la del sistema operativo, que es
        // lo que el usuario ya eligió fuera de esta aplicación.
        const mirror = readMirror();
        if (!mirror.theme) {
          setThemeState(window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        }
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Aplicar al documento. Se ejecuta también antes de `ready` para que el valor
  // del espejo llegue al DOM cuanto antes.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    root.dataset.density = density;
    writeMirror(theme, density);
  }, [theme, density]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    void updateMyPreference("ui-theme", { theme: next }).catch(() => undefined);
  }, []);

  const setDensity = useCallback((next: Density) => {
    setDensityState(next);
    void updateMyPreference("ui-density", { density: next }).catch(() => undefined);
  }, []);

  const value = useMemo<AppearanceValue>(
    () => ({ theme, density, setTheme, setDensity, ready }),
    [theme, density, setTheme, setDensity, ready],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

/**
 * Fuera del proveedor devuelve valores por defecto inertes en vez de lanzar.
 * Varias pantallas públicas (portal de empleo, firma, verificación de
 * certificado) montan componentes compartidos sin el armazón autenticado.
 */
export function useAppearance(): AppearanceValue {
  const context = useContext(AppearanceContext);
  return (
    context ?? {
      theme: "light",
      density: "comfortable",
      setTheme: () => undefined,
      setDensity: () => undefined,
      ready: false,
    }
  );
}

/**
 * Script de arranque. Se inyecta en `<head>` y corre antes del primer pintado,
 * así que el primer frame ya sale con el tema y la densidad correctos.
 *
 * Va todo dentro de un `try` porque `localStorage` no solo puede estar vacío:
 * en modo privado y con las cookies de terceros bloqueadas, el mero acceso
 * lanza. Un fallo aquí dejaría la página en blanco, y no merece la pena
 * arriesgar eso por evitar un parpadeo.
 */
export const APPEARANCE_BOOT_SCRIPT = `try{var s=localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});var t="light",d="comfortable";if(s){var p=JSON.parse(s);if(p&&p.theme==="dark")t="dark";if(p&&p.density==="compact")d="compact";}else if(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches){t="dark";}var r=document.documentElement;if(t==="dark")r.classList.add("dark");r.style.colorScheme=t;r.dataset.density=d;}catch(e){}`;
