import Link from "next/link";
import { dashboardKpis, marketingModules } from "@/lib/mock-data";

export default function Home() {
  const flows = [
    "Landing comercial orientada a conversion y demo",
    "Registro de empresa por pasos con activacion inicial",
    "Dashboard principal por rol con prioridades del dia",
    "Navegacion dinamica por plan, tenant y permisos",
  ];

  return (
    <main className="site-shell">
      <section className="hero">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">T</div>
            <div>
              <p>TalentOS</p>
              <span>Recruiting, onboarding and AI operations</span>
            </div>
          </div>
          <nav className="topnav">
            <a href="#modulos">Modulos</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#arquitectura">Arquitectura</a>
            <a href="#planes">Planes</a>
          </nav>
          <div className="topbar-actions">
            <Link className="ghost-button" href="#dashboard">
              Ver demo
            </Link>
            <Link className="primary-button" href="/register-company">
              Crear empresa
            </Link>
          </div>
        </header>

        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">SaaS multi-tenant para operaciones empresariales</span>
            <h1>
              Reclutamiento, incorporacion y productividad con IA en una sola
              plataforma.
            </h1>
            <p className="hero-text">
              Una base moderna para equipos de RRHH, operaciones y administracion
              que necesitan ejecutar procesos complejos con velocidad, claridad y
              control por tenant, rol y plan.
            </p>
            <div className="hero-cta">
              <Link className="primary-button" href="#modulos">
                Explorar modulos
              </Link>
              <Link className="secondary-button" href="/dashboard">
                Ver dashboard
              </Link>
              <Link className="secondary-button" href="#arquitectura">
                Revisar arquitectura UX
              </Link>
            </div>
            <div className="trust-strip">
              <span>WCAG 2.1 AA</span>
              <span>Next.js + TypeScript</span>
              <span>JWT + roles dinamicos</span>
              <span>Multi-tenant escalable</span>
            </div>
          </div>

          <div className="hero-panel" id="dashboard">
            <div className="window-chrome">
              <span />
              <span />
              <span />
            </div>
            <div className="workspace">
              <aside className="workspace-sidebar">
                <div className="tenant-chip">Tenant activo: Grupo Andina</div>
                <ul>
                  <li className="active">Dashboard</li>
                  <li>ATS</li>
                  <li>Onboarding</li>
                  <li>Entrenamiento</li>
                  <li>Productividad IA</li>
                  <li>Inventario</li>
                  <li>Administracion</li>
                </ul>
              </aside>

              <div className="workspace-main">
                <div className="workspace-header">
                  <div>
                    <p className="section-label">Resumen ejecutivo</p>
                    <h2>Operacion del dia</h2>
                  </div>
                  <div className="header-pill">Plan Enterprise</div>
                </div>

                <div className="kpi-grid">
                  {dashboardKpis.map((kpi) => (
                    <article key={kpi.label} className="metric-card">
                      <span>{kpi.label}</span>
                      <strong>{kpi.value}</strong>
                      <p>{kpi.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="dashboard-grid">
                  <article className="glass-card chart-card">
                    <div className="card-head">
                      <div>
                        <p className="section-label">Pipeline de seleccion</p>
                        <h3>Contrataciones por etapa</h3>
                      </div>
                      <span className="status-chip status-success">+18% mensual</span>
                    </div>
                    <div className="chart-bars" aria-hidden="true">
                      <span style={{ height: "58%" }} />
                      <span style={{ height: "82%" }} />
                      <span style={{ height: "74%" }} />
                      <span style={{ height: "96%" }} />
                      <span style={{ height: "64%" }} />
                      <span style={{ height: "88%" }} />
                    </div>
                  </article>

                  <article className="glass-card alerts-card">
                    <div className="card-head">
                      <div>
                        <p className="section-label">IA operativa</p>
                        <h3>Alertas priorizadas</h3>
                      </div>
                      <span className="status-chip status-warning">3 activas</span>
                    </div>
                    <ul className="signal-list">
                      <li>
                        <strong>Onboarding incompleto</strong>
                        <span>18 ingresos aun esperan firma documental.</span>
                      </li>
                      <li>
                        <strong>Inventario critico</strong>
                        <span>Stock bajo en equipos de campo para Bogota.</span>
                      </li>
                      <li>
                        <strong>Entrenamiento vencido</strong>
                        <span>4 lideres deben renovar certificacion obligatoria.</span>
                      </li>
                    </ul>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="modulos">
        <div className="section-heading">
          <span className="eyebrow">Modulos principales</span>
          <h2>Una arquitectura visual pensada para operar con complejidad real.</h2>
          <p>
            Cada modulo comparte patrones consistentes de navegacion, estados,
            permisos y acciones, para que la experiencia escale sin friccion.
          </p>
        </div>
        <div className="module-grid">
          {marketingModules.map((module) => (
            <article key={module.title} className="module-card">
              <div className="module-icon" />
              <h3>{module.title}</h3>
              <p>{module.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-contrast" id="arquitectura">
        <div className="section-heading narrow">
          <span className="eyebrow">Base UX del producto</span>
          <h2>Diseño preparado para permisos dinamicos, planes y crecimiento por tenant.</h2>
        </div>

        <div className="architecture-grid">
          <article className="architecture-card">
            <p className="section-label">Flujos priorizados</p>
            <ul className="stack-list">
              {flows.map((flow) => (
                <li key={flow}>{flow}</li>
              ))}
            </ul>
          </article>

          <article className="architecture-card">
            <p className="section-label">Reglas de visibilidad</p>
            <div className="code-block">
              <span>visible = moduleEnabled</span>
              <span>&amp;&amp; planAllows</span>
              <span>&amp;&amp; roleAllows</span>
              <span>&amp;&amp; permissionAllows</span>
            </div>
          </article>

          <article className="architecture-card">
            <p className="section-label">Estados listos para produccion</p>
            <div className="badge-row">
              <span className="mini-badge">Loading</span>
              <span className="mini-badge">Empty</span>
              <span className="mini-badge">Success</span>
              <span className="mini-badge">Error</span>
              <span className="mini-badge">Restricted</span>
              <span className="mini-badge">Timeout</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section" id="planes">
        <div className="plans-card">
          <div className="section-heading narrow">
            <span className="eyebrow">Salida comercial</span>
            <h2>Lista para evolucionar desde MVP hasta un suite empresarial completa.</h2>
            <p>
              Esta primera base ya deja el sistema visual, la narrativa comercial
              y el preview operativo alineados con el brief del producto.
            </p>
          </div>
          <div className="plans-actions">
            <Link className="primary-button" href="/login">
              Iniciar sesion
            </Link>
            <Link className="primary-button" href="/dashboard">
              Revisar dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
