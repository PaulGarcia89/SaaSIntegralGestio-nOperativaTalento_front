import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel compact">
        <div className="auth-copy">
          <span className="eyebrow eyebrow-soft">Recuperacion de contrasena</span>
          <h1>Recibe un enlace seguro para restablecer tu acceso.</h1>
          <p>Esta vista contempla estados de exito, link expirado y nueva solicitud.</p>
        </div>
        <div className="auth-form">
          <div className="field">
            <label>Email</label>
            <input placeholder="tu@email.com" />
          </div>
          <Link className="primary-button" href="/login">
            Enviar enlace
          </Link>
        </div>
      </section>
    </main>
  );
}
