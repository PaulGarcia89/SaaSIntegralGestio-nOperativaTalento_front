"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/store/app-store";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAppStore();
  const [email, setEmail] = useState("sofia.herrera@grupoandina.com");
  const [password, setPassword] = useState("");

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow eyebrow-soft">Inicio de sesion</span>
          <h1>Accede al workspace de tu empresa.</h1>
          <p>
            Diseno limpio, enfocado en acceso rapido, seguridad y futura evolucion
            hacia SSO, MFA y deteccion de tenant por dominio.
          </p>
        </div>
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            signIn(email);
            router.push("/dashboard");
          }}
        >
          <div className="field">
            <label>Correo corporativo</label>
            <input
              placeholder="nombre@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label>Contrasena</label>
            <input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button className="primary-button" type="submit">
            Ingresar
          </button>
          <Link className="ghost-button dark" href="/forgot-password">
            Recuperar contrasena
          </Link>
        </form>
      </section>
    </main>
  );
}
