#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auditoría de idioma: qué pantallas cambian de español a inglés y cuáles no.

Por qué
-------
El selector de idioma solo cambia lo que pasa por el diccionario. Un texto
escrito a mano dentro del JSX se queda en español para siempre, y nada lo
detecta: es código válido, compila y renderiza. El resultado en pantalla es
una página a medias, que se lee peor que si estuviera entera en un idioma:
parece rota, no bilingüe.

Cómo mide
---------
En vez de intentar distinguir «prosa» de una clase de Tailwind —ambiguo y
lleno de falsos positivos—, busca ESPAÑOL: vocal acentuada, eñe, signos de
apertura o una palabra funcional española suelta. Una clase de Tailwind no
contiene ninguna de esas cosas, así que la señal es limpia. Antes de mirar
quita los comentarios, las claves de `t("…")` y los pares de `tx("es","en")`,
que sí cambian de idioma aunque no pasen por el diccionario.

El veredicto es por PANTALLA, no por archivo: casi todas las `page.tsx` son
envoltorios de tres líneas y el texto vive en los componentes que renderizan,
así que se recorre el árbol de importaciones de cada página y se suma. Se
excluyen `components/ui` y `components/system`, que son piezas sin texto
propio.

Uso
---
    python3 scripts/audit-i18n.py

Sale con código 1 si alguna pantalla tiene texto sin traducir, para poder
encadenarlo en CI.
"""
import io, os, re, unicodedata, json
from collections import defaultdict

ACENTOS = re.compile(r'[áéíóúüñÁÉÍÓÚÜÑ¿¡]')
PALABRAS = re.compile(r'(^|[\s.,;:(¿¡])(de|del|la|el|los|las|una|unas|unos|para|con|que|tu|tus|su|sus|cada|sin|desde|hasta|entre|sobre|cuando|donde|este|esta|estos|estas|todo|toda|todos|todas|hay|está|están|puede|pueden|debe|deben|por|al|lo|le|les)([\s.,;:)?!]|$)', re.I)
OK = {"TalentOS", "T"}

def limpiar(f):
    f = re.sub(r'/\*[\s\S]*?\*/', ' ', f)
    f = re.sub(r'(^|[^:])//[^\n]*', r'\1 ', f)
    f = re.sub(r'\bt\(\s*(["\'`])[^"\'`]*\1', 't(KEY', f)
    f = re.sub(r'\bt\(\s*`[^`]*`', 't(KEY', f)
    f = re.sub(r'\btx\(\s*"[^"]*"\s*,\s*"[^"]*"\s*\)', 'tx(BI)', f)
    # Mapa bilingüe escrito a mano —`const copy = { es: {…}, en: {…} }`—: no pasa
    # por el diccionario, pero SÍ cambia de idioma, así que no es un hallazgo.
    f = re.sub(r'\n\s*es:\s*\{[\s\S]*?\n\s*en:\s*\{[\s\S]*?\n\} as const;', '\n// mapa bilingüe\n', f)
    # Un `throw new Error("…")` no llega nunca a pantalla: es un mensaje para
    # quien programa. Sin esta línea, la única excepción de `locale-provider`
    # bastaba para marcar «a medias» las 108 pantallas, porque ese archivo está
    # en el árbol de todas.
    return re.sub(r'throw new Error\([^)]*\)', 'throw new Error(DEV)', f)
    return f

def esp(t): return bool(ACENTOS.search(t) or PALABRAS.search(t))

def contar(f):
    n = 0
    for m in re.finditer(r'>([^<>{}\n]{2,})<', f):
        t = m.group(1).strip()
        if t and t not in OK and esp(t): n += 1
    for q in ('"', "'"):
        for m in re.finditer(rf'{q}([^{q}\\\n]{{3,}}){q}', f):
            if m.group(1) not in OK and esp(m.group(1)): n += 1
    return n

fuentes, propio = {}, {}
for raiz, dirs, fs in os.walk("src"):
    dirs[:] = [d for d in dirs if d not in {"node_modules", ".next"}]
    for f in fs:
        if not (f.endswith(".tsx") or f.endswith(".ts")) or ".test." in f: continue
        p = os.path.join(raiz, f)
        crudo = unicodedata.normalize("NFC", io.open(p, encoding="utf-8").read())
        fuentes[p] = crudo
        propio[p] = contar(limpiar(crudo))

def resolver(spec):
    if not spec.startswith("@/"): return None
    base = "src/" + spec[2:]
    for cand in (base + ".tsx", base + ".ts", base + "/index.tsx", base + "/index.ts"):
        if cand in fuentes: return cand
    return None

deps = {p: {r for r in (resolver(m.group(1)) for m in re.finditer(r'from "(@/[^"]+)"', s)) if r} for p, s in fuentes.items()}

def arbol(p, visto=None):
    visto = visto or set()
    if p in visto: return visto
    visto.add(p)
    for d in deps.get(p, ()): arbol(d, visto)
    return visto

def ruta_de(p):
    r = p.replace("src/app", "").replace("/page.tsx", "")
    r = re.sub(r'/\((?:app|auth|public)\)', '', r)
    return r or "/"

pantallas = {}
for p in fuentes:
    if "/app/" in p and p.endswith("page.tsx"):
        arb = arbol(p) - {p}
        # solo componentes de pantalla, no utilidades ni el sistema de diseño
        arb = {a for a in arb if a.endswith(".tsx") and "/components/ui/" not in a and "/components/system/" not in a}
        total = propio[p] + sum(propio[a] for a in arb)
        usa_t = sum(len(re.findall(r'\bt\(["\'`]', fuentes[a])) for a in arb | {p})
        pantallas[ruta_de(p)] = {"esp": total, "t": usa_t, "propio": propio[p], "arch": len(arb) + 1}

enteras = {r: d for r, d in pantallas.items() if d["esp"] == 0}
medias  = {r: d for r, d in pantallas.items() if d["esp"] > 0 and d["t"] > 0}
nada    = {r: d for r, d in pantallas.items() if d["esp"] > 0 and d["t"] == 0}

print(f"PANTALLAS ANALIZADAS: {len(pantallas)}  (página + su árbol de componentes)")
print(f"  ✔ cambian de idioma enteras      {len(enteras):3d}")
print(f"  ~ cambian a medias               {len(medias):3d}")
print(f"  ✘ no cambian nada                {len(nada):3d}")
print()
print("=== NO CAMBIAN NADA ===")
for r, d in sorted(nada.items(), key=lambda kv: -kv[1]["esp"]):
    print(f"  {d['esp']:5d} cadenas   {r}")
print()
print("=== CAMBIAN A MEDIAS (las 25 peores) ===")
for r, d in sorted(medias.items(), key=lambda kv: -kv[1]["esp"])[:25]:
    print(f"  {d['esp']:5d} sueltas / {d['t']:4d} traducidas   {r}")
import sys
sys.exit(1 if (medias or nada) else 0)
