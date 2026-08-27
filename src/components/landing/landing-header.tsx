"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";

const links = [
  { href: "#producto", label: "Producto" },
  { href: "#soluciones", label: "Soluciones" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#planes", label: "Módulos" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  return <header className="relative z-20 flex items-center justify-between gap-4 py-5"><Link href="/" className="flex items-center gap-3 text-white" aria-label="TalentOS, inicio"><span className="flex size-10 items-center justify-center rounded-xl bg-cyan-400 text-base font-bold text-slate-950 shadow-lg shadow-cyan-400/20">T</span><span><strong className="block text-base">TalentOS</strong><span className="text-xs text-white/65">Gestión de equipos</span></span></Link><nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">{links.map((link) => <a key={link.href} href={link.href} className="rounded-xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white">{link.label}</a>)}<a href="#candidatos" className="rounded-xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white">Empleos</a><LanguageSelector compact /><Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><Link href="/login">Iniciar sesión</Link></Button><Button asChild className="bg-cyan-400 text-slate-950 shadow-none hover:bg-cyan-300"><Link href="/register-company">Registrar empresa</Link></Button></nav><Button type="button" size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="landing-mobile-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"}>{open ? <X /> : <Menu />}</Button>{open ? <nav id="landing-mobile-menu" className="absolute left-0 right-0 top-[calc(100%+0.25rem)] grid gap-1 rounded-2xl border border-white/15 bg-slate-950/98 p-3 shadow-2xl lg:hidden" aria-label="Navegación móvil">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="min-h-11 rounded-xl px-3 py-3 text-sm text-white/85 hover:bg-white/10">{link.label}</a>)}<Link href="/jobs" onClick={() => setOpen(false)} className="min-h-11 rounded-xl px-3 py-3 text-sm text-white/85 hover:bg-white/10">Buscar empleos</Link><Link href="/application-status" onClick={() => setOpen(false)} className="min-h-11 rounded-xl px-3 py-3 text-sm text-white/85 hover:bg-white/10">Seguir postulación</Link><Link href="/login" onClick={() => setOpen(false)} className="min-h-11 rounded-xl px-3 py-3 text-sm text-white/85 hover:bg-white/10">Iniciar sesión</Link><LanguageSelector /><Button asChild className="mt-1 bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Link href="/register-company">Registrar empresa</Link></Button></nav> : null}</header>;
}
