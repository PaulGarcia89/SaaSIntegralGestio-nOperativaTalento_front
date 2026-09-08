"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Eye, EyeOff, ScrollText, ShieldCheck } from "lucide-react";
import { authenticateUser } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { DEMO_MODE_ENABLED } from "@/components/integration-state";
import { FormErrorSummary } from "@/components/form-error-summary";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";
import styles from "./login.module.css";

/* ==========================================================================
   INICIO DE SESIÓN
   ==========================================================================
   La primera pantalla de la aplicación y la única que ve TODO el mundo, desde
   el administrador del inquilino hasta quien solo va a fichar. Se rehízo con
   la gramática de las páginas públicas —fondo grafito con retícula, luz ámbar,
   ámbar solo para lo que importa— pero con una regla propia: aquí no se viene
   a leer, se viene a entrar.

   Qué estaba mal y qué se hizo
   ----------------------------
   · En el móvil el panel de marketing iba PRIMERO: en un iPhone había que
     pasar un titular y dos tarjetas antes de ver el campo del correo. Ahora
     el panel grande existe solo a partir de `lg`; en móvil queda una banda
     compacta con la marca y el formulario entra en la primera pantalla.
   · Había tres botones apilados del mismo tamaño —entrar, «olvidé mi
     contraseña» y «volver al sitio»— compitiendo entre ellos. Solo entrar es
     una acción; los otros dos son enlaces y ahora se ven como tales.
   · Los campos no declaraban `autocomplete`, así que ni el llavero de iOS ni
     ningún gestor de contraseñas rellenaba nada. Es la corrección más útil de
     todo el cambio y no se ve.
   · La casilla «recordar» no hacía nada: no existe tal parámetro en
     `POST /auth/login`. En vez de fingir, ahora recuerda el CORREO en este
     dispositivo, que es lo que de verdad ahorra tecleo, y el rótulo lo dice.
   · Dos titulares competían (uno en el panel, otro sobre el formulario).
     Queda uno.
   · El botón de ver la contraseña medía 16 px. Ahora 44.
   · Se pasó de `bg-card` / `text-muted-foreground` a los tokens del sistema
     (`surface-1`, `ink-2`, `line`), que es lo que usa el resto de la
     aplicación desde el rediseño.

   Se conserva: `authenticateUser` y su contrato, el `returnTo` validado
   contra rutas relativas, el resumen de errores accesible, el atajo del
   entorno de prueba y todas las claves de traducción existentes.
   ========================================================================== */

// El esquema se construye DENTRO del componente: declarado a nivel de módulo
// no alcanza a `t`, así que sus mensajes de validación se quedaban en español
// —y las claves para traducirlos ya existían sin usar—.
const loginSchema = z.object({ email: z.email(), password: z.string().min(6) });

type LoginFormValues = z.infer<typeof loginSchema>;

/** Dónde se guarda el correo cuando se marca la casilla. */
const CORREO_RECORDADO = "talentos.login.email";

/**
 * Lee el correo recordado.
 *
 * Va por `useSyncExternalStore` y no por un efecto que llame a `setState`: en
 * el servidor no existe `localStorage`, así que la instantánea del servidor es
 * `null` y React resuelve él mismo la diferencia al hidratar, sin aviso de
 * discrepancia y sin un render en cascada.
 */
const suscribir = () => () => {};
const instantaneaServidor = () => null;
function leerCorreoRecordado() {
  try {
    return window.localStorage.getItem(CORREO_RECORDADO);
  } catch {
    // Navegación privada o almacenamiento bloqueado: se entra igual.
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  const correoRecordado = useSyncExternalStore(suscribir, leerCorreoRecordado, instantaneaServidor);
  // La casilla arranca marcada si ya había un correo guardado; en cuanto la
  // persona la toca manda su decisión.
  const [decisionCasilla, setDecisionCasilla] = useState<boolean | null>(null);
  const remember = decisionCasilla ?? Boolean(correoRecordado);

  // Se extiende el esquema base en vez de reescribirlo: así hay UNA definición
  // de la forma y aquí solo se ponen los mensajes en el idioma activo.
  const schema = useMemo(
    () =>
      loginSchema.extend({
        email: z.email(t("auth.invalidEmail")),
        password: z.string().min(6, t("auth.passwordMin")),
      }),
    [t],
  );
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  // Volcar el correo en el formulario sí es un efecto: se está escribiendo en
  // react-hook-form, que es un almacén externo a React, no en su estado.
  const { setValue } = form;
  useEffect(() => {
    if (correoRecordado) setValue("email", correoRecordado);
  }, [correoRecordado, setValue]);

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) =>
      authenticateUser({ email: values.email, password: values.password }),
    onSuccess: (_data, values) => {
      try {
        if (remember) window.localStorage.setItem(CORREO_RECORDADO, values.email);
        else window.localStorage.removeItem(CORREO_RECORDADO);
      } catch {
        // Igual que arriba: recordar el correo es una comodidad, no un requisito.
      }

      const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
      const destination =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/dashboard";

      // Conserva el token de acceso en memoria durante el cambio de ruta. Un
      // recargo completo forzaría un intercambio innecesario de la cookie de actualización.
      router.replace(destination);
    },
  });

  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-[1.05fr_minmax(0,560px)]">
      <BrandPanel />

      <div className="flex min-w-0 flex-col">
        {/* ---- Banda de marca: solo en móvil y tableta ------------------- */}
        <div className="relative isolate overflow-hidden bg-[linear-gradient(160deg,hsl(213_40%_10%),hsl(213_34%_15%))] px-4 pb-14 pt-4 text-surface-dark-ink sm:px-8 lg:hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="public-grid public-grid-dark absolute inset-0" />
            <div className="public-glow absolute -right-16 -top-24 size-72 rounded-full bg-accent-fill/25 blur-3xl" />
          </div>
          <div className="relative flex items-center justify-between gap-3">
            <BackLink tone="dark" label={t("auth.backToPublicSite")} />
            <LanguageSelector compact tone="dark" />
          </div>
          <div className="relative mt-8">
            <Wordmark tone="dark" tagline={t("landing.brand.tagline")} />
          </div>
        </div>

        {/* ---- Barra clara: solo en escritorio --------------------------- */}
        <div className="hidden items-center justify-between gap-3 px-8 py-5 lg:flex xl:px-12">
          <BackLink tone="light" label={t("auth.backToPublicSite")} />
          <LanguageSelector compact />
        </div>

        {/* ---- Formulario ------------------------------------------------ */}
        <div className="relative -mt-8 flex flex-1 flex-col justify-center rounded-t-3xl bg-canvas px-4 pb-10 pt-8 sm:px-8 lg:mt-0 lg:rounded-none lg:px-12 lg:pb-14 xl:px-16">
          <form
            method="post"
            noValidate
            className={`${styles.enter} mx-auto w-full max-w-[26rem] space-y-6`}
            onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
          >
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-1">{t("auth.welcomeBack")}</h1>
              <p className="mt-2 text-base leading-7 text-ink-2">{t("auth.signInHint")}</p>
            </div>

            <FormErrorSummary
              errors={Object.entries(form.formState.errors).map(([field, issue]) => ({
                fieldId: `login-${field}`,
                label: field === "email" ? t("auth.email") : t("auth.password"),
                message: issue?.message ?? t("forms.checkField"),
              }))}
              serverError={loginMutation.error}
              context="authentication"
            />

            <div className="space-y-4">
              <FormField id="login-email" label={t("auth.email")} error={form.formState.errors.email?.message} required>
                {(fieldProps) => (
                  <Input
                    id={fieldProps.id}
                    aria-describedby={fieldProps["aria-describedby"]}
                    aria-invalid={fieldProps["aria-invalid"]}
                    type="email"
                    inputMode="email"
                    // Sin esto ni el llavero de iOS ni ningún gestor de
                    // contraseñas ofrece rellenar el formulario.
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder={t("auth.emailPlaceholder")}
                    {...form.register("email")}
                  />
                )}
              </FormField>

              <FormField id="login-password" label={t("auth.password")} error={form.formState.errors.password?.message} required>
                {(fieldProps) => (
                  <div className="relative">
                    <Input
                      id={fieldProps.id}
                      aria-describedby={fieldProps["aria-describedby"]}
                      aria-invalid={fieldProps["aria-invalid"]}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      enterKeyHint="go"
                      className="pr-14"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      // 44 px reales: antes era un icono de 16 px sin área.
                      className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:text-ink-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                    </button>
                  </div>
                )}
              </FormField>
            </div>

            {/* Recordar y recuperar comparten fila: son las dos decisiones
                pequeñas que se toman antes de pulsar entrar. */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <label htmlFor="remember" className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-ink-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setDecisionCasilla(event.target.checked)}
                  className="size-5 rounded border-line-control accent-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                />
                {t("auth.remember")}
              </label>
              <Link
                href="/forgot-password"
                className="inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            {/* La altura la pone el tamaño `lg` del sistema (--control-h-touch), no
                una medida escrita aquí: así sigue reescalando con la densidad. */}
            <Button size="lg" type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t("actions.loading") : t("auth.login")}
            </Button>

            {DEMO_MODE_ENABLED ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  form.setValue("email", "ava.thompson@talentoscloud.com");
                  form.setValue("password", "ChangeMe123!");
                }}
              >
                {t("auth.demoEnvironment")}
              </Button>
            ) : null}

            <p className="border-t border-line pt-5 text-sm leading-6 text-ink-3">{t("auth.needHelp")}</p>
          </form>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

/** Marca: el mismo mosaico ámbar con la «T» que llevan la portada y el pie. */
function Wordmark({ tone, tagline }: { tone: "dark" | "light"; tagline: string }) {
  const dark = tone === "dark";
  return (
    <p className={`flex items-center gap-3 ${dark ? "text-surface-dark-ink" : "text-ink-1"}`}>
      <span className="flex size-11 items-center justify-center rounded-xl bg-accent-fill text-lg font-bold text-surface-dark-1 shadow-lg shadow-accent-fill/20">
        T
      </span>
      <span>
        <strong className="block text-lg font-semibold leading-tight">TalentOS</strong>
        <span className={`block text-sm ${dark ? "text-surface-dark-ink/65" : "text-ink-3"}`}>{tagline}</span>
      </span>
    </p>
  );
}

/** Vuelta al sitio público: es un enlace, no una tercera acción principal. */
function BackLink({ tone, label }: { tone: "dark" | "light"; label: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        tone === "dark"
          ? "text-surface-dark-ink/75 hover:text-surface-dark-ink focus-visible:outline-accent-fill"
          : "text-ink-2 hover:text-ink-1 focus-visible:outline-focus"
      }`}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

/**
 * Panel de marca, solo a partir de `lg`.
 *
 * No promete nada que la aplicación no haga: las tres filas describen lo que
 * el usuario va a encontrar al otro lado —su empresa y sucursal, su menú
 * recortado a sus permisos, y el rastro de quién hizo qué—, no ventajas
 * comerciales.
 */
function BrandPanel() {
  const { t } = useLocale();
  const points = [
    { key: "scope", icon: Building2 },
    { key: "tailored", icon: ShieldCheck },
    { key: "audit", icon: ScrollText },
  ] as const;

  return (
    <aside className="relative isolate hidden overflow-hidden bg-[linear-gradient(160deg,hsl(213_40%_10%),hsl(213_34%_15%)_55%,hsl(206_30%_19%))] p-8 text-surface-dark-ink lg:flex lg:flex-col lg:justify-between lg:gap-8 xl:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="public-grid public-grid-dark absolute inset-0" />
        <div className="public-glow absolute -right-28 -top-32 size-[32rem] rounded-full bg-accent-fill/25 blur-3xl" />
        <div className="public-glow-2 absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-surface-dark-3 blur-3xl" />
      </div>

      <div className="relative">
        <Wordmark tone="dark" tagline={t("landing.brand.tagline")} />
      </div>

      <div className="relative max-w-xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent-fill/30 bg-accent-fill/10 px-3 py-1.5 text-sm font-medium text-accent-fill">
          <span className="size-1.5 rounded-full bg-accent-fill" />
          {t("auth.secureAccess")}
        </p>
        <h2 className="mt-6 text-balance text-[2.1rem] font-semibold leading-[1.1] tracking-tight xl:text-[2.6rem]">
          {t("auth.hero.title")}
        </h2>
        <p className="mt-4 max-w-lg text-pretty text-base leading-7 text-surface-dark-ink/75">
          {t("auth.hero.description")}
        </p>

        <ul className="mt-8 space-y-4">
          {points.map(({ key, icon: Icon }) => (
            <li key={key} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-surface-dark-ink/12 bg-surface-dark-ink/[0.06] text-accent-fill">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <strong className="block font-semibold">{t(`auth.hero.${key}.title`)}</strong>
                <span className="mt-1 block text-sm leading-6 text-surface-dark-ink/70">{t(`auth.hero.${key}.copy`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-surface-dark-ink/55">{t("auth.hero.footnote")}</p>
    </aside>
  );
}
