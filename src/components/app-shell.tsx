"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAppStore } from "@/store/app-store";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const {
    allowedNav,
    currentRole,
    currentTenant,
    currentUser,
    setCurrentRole,
    setCurrentTenantId,
    signOut,
    tenants,
  } = useAppStore();
  const groups = ["General", "RRHH", "Operacion", "Administracion"] as const;

  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <div className="brand brand-compact">
          <div className="brand-mark">T</div>
          <div>
            <p>TalentOS</p>
            <span>Enterprise suite</span>
          </div>
        </div>

        <div className="tenant-panel">
          <span className="section-label">Tenant activo</span>
          <strong>{currentTenant.name}</strong>
          <p>Plan {currentTenant.plan} · soporte {currentTenant.branding.supportEmail}</p>
        </div>

        <div className="sidebar-controls">
          <label className="field">
            <span>Empresa</span>
            <select value={currentTenant.id} onChange={(event) => setCurrentTenantId(event.target.value)}>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Rol demo</span>
            <select value={currentRole} onChange={(event) => setCurrentRole(event.target.value as typeof currentRole)}>
              <option value="admin_saas">Admin SaaS</option>
              <option value="admin_empresa">Admin Empresa</option>
              <option value="rrhh">RRHH</option>
              <option value="lider_area">Lider de area</option>
              <option value="empleado">Empleado</option>
            </select>
          </label>
        </div>

        {groups.map((group) => (
          <div key={group} className="nav-group">
            <p className="nav-group-title">{group}</p>
            <nav className="sidebar-nav">
              {allowedNav
                .filter((item) => item.group === group)
                .map((item) => {
                  const active = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={active ? "nav-link active" : "nav-link"}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
          </div>
        ))}
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <div>
            <p className="section-label">Operacion en vivo</p>
            <h1 className="app-title">{currentTenant.name}</h1>
          </div>
          <div className="topbar-utilities">
            <div className="utility-chip">Rol: {currentRole}</div>
            <div className="utility-chip">Usuario: {currentUser.fullName}</div>
            <button className="utility-chip button-chip" onClick={signOut} type="button">
              Cerrar sesion mock
            </button>
            <Link href="/profile" className="profile-chip">
              {currentUser.fullName
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </Link>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
