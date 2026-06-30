import Link from "next/link";

export default function RegisterCompanyPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel register">
        <div className="auth-copy">
          <span className="eyebrow eyebrow-soft">Registro de empresa</span>
          <h1>Provisiona un nuevo tenant con un flujo claro y escalable.</h1>
          <p>
            El onboarding comercial se divide en pasos: empresa, admin principal,
            plan, modulos y confirmacion.
          </p>
          <div className="steps-list">
            <span>1. Empresa</span>
            <span>2. Administrador</span>
            <span>3. Plan</span>
            <span>4. Modulos</span>
            <span>5. Confirmacion</span>
          </div>
        </div>
        <div className="auth-form">
          <div className="field">
            <label>Nombre de empresa</label>
            <input placeholder="Grupo Andina" />
          </div>
          <div className="field">
            <label>Administrador principal</label>
            <input placeholder="Nombre y apellido" />
          </div>
          <div className="field">
            <label>Plan inicial</label>
            <input placeholder="Enterprise" />
          </div>
          <Link className="primary-button" href="/dashboard">
            Crear tenant
          </Link>
        </div>
      </section>
    </main>
  );
}
