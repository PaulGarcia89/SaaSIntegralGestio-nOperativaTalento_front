"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Clipboard, Search } from "lucide-react";
import Link from "next/link";
import { getApiErrorMessage, lookupInventoryAsset } from "@/lib/backend";
import type { InventoryAssetDto } from "@/lib/contracts";
import { InlineNote, PageHeader, PageSection, StatusBadge } from "@/components/system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assetStatusLabel, assetStatusTone, conditionLabel, conditionTone } from "@/lib/inventory-labels";

/**
 * Consulta rápida de un activo por su etiqueta.
 *
 * Qué cambió
 * ----------
 * · El estado y la condición salían con su código: se leía «RETURN_PENDING» y
 *   «DAMAGED». El diccionario ya existía dentro de otro archivo del mismo
 *   módulo y esta pantalla no lo usaba.
 * · El estado se pintaba como una píldora gris fuera cual fuera: «Perdido» y
 *   «Disponible» se veían idénticos.
 * · El bloque del QR parecía un escáner pero no escanea nada: el texto
 *   explicaba, debajo, que hay que usar el lector del dispositivo. Se cambia
 *   por una instrucción sin promesa visual.
 * · El error decía siempre «no encontramos un activo con esa etiqueta», aunque
 *   el fallo fuera de red o de permisos.
 * · «Copiar etiqueta» no confirmaba que hubiera copiado nada.
 * · Desde el resultado no se podía ir a la ficha del activo.
 */
export default function InventoryScanPage() {
  const [tag, setTag] = useState("");
  const [copied, setCopied] = useState(false);
  const lookup = useMutation({ mutationFn: () => lookupInventoryAsset(tag) });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="Operación móvil"
        title="Consultar un activo"
        description="Escribe la etiqueta, o escanéala con el lector del dispositivo, para ver de quién es y en qué estado está."
      />

      <PageSection title="Etiqueta del activo" boxed>
        <p className="text-sm text-ink-2">
          Si tu dispositivo tiene lector de códigos, colócate en este campo y escanea: el valor se escribe solo.
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <Label htmlFor="asset-tag">Etiqueta</Label>
            <Input
              id="asset-tag"
              autoCapitalize="characters"
              autoComplete="off"
              value={tag}
              placeholder="LAP-000123"
              onChange={(event) => {
                setTag(event.target.value);
                setCopied(false);
              }}
              onKeyDown={(event) => event.key === "Enter" && tag.trim() && lookup.mutate()}
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!tag.trim()}
            loading={lookup.isPending}
            loadingLabel="Consultando…"
            onClick={() => lookup.mutate()}
          >
            <Search className="size-4" aria-hidden="true" />
            Consultar
          </Button>
        </div>

        {lookup.isError ? (
          <div className="mt-3">
            <InlineNote tone="warning" title="No se encontró el activo">
              {getApiErrorMessage(
                lookup.error,
                "No hay ningún activo con esa etiqueta en la empresa activa. Comprueba que la copiaste entera.",
              )}
            </InlineNote>
          </div>
        ) : null}
      </PageSection>

      {lookup.data ? <AssetResult asset={lookup.data} copied={copied} onCopied={setCopied} /> : null}
    </div>
  );
}

function AssetResult({
  asset,
  copied,
  onCopied,
}: {
  asset: InventoryAssetDto;
  copied: boolean;
  onCopied: (value: boolean) => void;
}) {
  return (
    <PageSection title={asset.item.name} description={`${asset.item.sku} · ${asset.serialNumber || "sin número de serie"}`} boxed>
      <p className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-3">{asset.assetTag}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge tone={assetStatusTone(asset.status)} label={assetStatusLabel(asset.status)} />
        <StatusBadge size="sm" tone={conditionTone(asset.condition)} label={conditionLabel(asset.condition)} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-3">Sucursal</dt>
          <dd className="font-medium text-ink-1">{asset.branch.name}</dd>
        </div>
        <div>
          <dt className="text-ink-3">En custodia de</dt>
          <dd className="font-medium text-ink-1">{asset.employee?.name || "Sin asignar"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="secondary" className="sm:flex-1">
          <Link href={`/inventory/assets?search=${encodeURIComponent(asset.assetTag)}`}>Abrir su ficha</Link>
        </Button>
        <Button
          variant="secondary"
          className="sm:flex-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(asset.assetTag);
              onCopied(true);
            } catch {
              // Algunos navegadores bloquean el portapapeles sin gesto directo;
              // no decir nada sería peor que no copiar.
              onCopied(false);
            }
          }}
        >
          <Clipboard className="size-4" aria-hidden="true" />
          {copied ? "Etiqueta copiada" : "Copiar etiqueta"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Etiqueta copiada al portapapeles" : ""}
      </p>
    </PageSection>
  );
}
