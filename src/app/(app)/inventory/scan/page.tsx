"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Clipboard, QrCode, Search } from "lucide-react";
import { lookupInventoryAsset } from "@/lib/backend";
import type { InventoryAssetDto } from "@/lib/contracts";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InventoryScanPage() {
  const [tag, setTag] = useState("");
  const lookup = useMutation({ mutationFn: () => lookupInventoryAsset(tag) });
  return <div className="mx-auto max-w-xl space-y-6"><PageHeader eyebrow="Operación móvil" title="Escanear activo" description="Escanea con la cámara del dispositivo o escribe la etiqueta para consultar custodia, sucursal y estado." /><Card level={1}><CardContent className="space-y-4 p-5"><div className="rounded-2xl bg-primary/10 p-4 text-center"><QrCode className="mx-auto size-12 text-primary" /><p className="mt-2 text-sm text-text-secondary">Usa la cámara del lector QR/código de barras del dispositivo: el valor se insertará en este campo.</p></div><div><Label htmlFor="asset-tag">Etiqueta del activo</Label><Input id="asset-tag" autoCapitalize="characters" value={tag} onChange={(event) => setTag(event.target.value)} onKeyDown={(event) => event.key === "Enter" && lookup.mutate()} placeholder="Ej.: LAP-000123" /></div><Button className="w-full" disabled={!tag.trim() || lookup.isPending} onClick={() => lookup.mutate()}><Search className="size-4" />{lookup.isPending ? "Consultando…" : "Consultar activo"}</Button>{lookup.isError ? <p role="alert" className="text-sm text-status-danger">No encontramos un activo con esa etiqueta en la empresa seleccionada.</p> : null}</CardContent></Card>{lookup.data ? <AssetResult asset={lookup.data} /> : null}</div>;
}

function AssetResult({ asset }: { asset: InventoryAssetDto }) { return <Card level={2}><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-primary">{asset.assetTag}</p><h2 className="text-xl font-semibold">{asset.item.name}</h2><p className="text-sm text-text-secondary">{asset.item.sku} · {asset.serialNumber || "Sin serie"}</p></div><p className="rounded-full bg-secondary px-3 py-1 text-sm font-medium">{asset.status}</p></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-text-secondary">Sucursal</dt><dd className="font-medium">{asset.branch.name}</dd></div><div><dt className="text-text-secondary">Condición</dt><dd className="font-medium">{asset.condition}</dd></div><div className="col-span-2"><dt className="text-text-secondary">Custodia</dt><dd className="font-medium">{asset.employee?.name || "Sin asignar"}</dd></div></dl><Button variant="secondary" className="w-full" onClick={() => void navigator.clipboard.writeText(asset.assetTag)}><Clipboard className="size-4" />Copiar etiqueta</Button></CardContent></Card>; }
