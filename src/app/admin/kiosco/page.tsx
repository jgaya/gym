import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getKioscoData } from "./actions";
import { KioscoClient } from "./KioscoClient";

export const metadata: Metadata = {
  title: "Kiosco y Ventas en Mostrador — Gym Meraki Admin",
  description:
    "Registro de ventas rápidas adicionales en mostrador, control de stock, precios de compra y precios de venta por sucursal.",
};

export default async function AdminKioscoPage() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")
  ) {
    redirect("/admin/rutinas?error=acceso_kiosco_denegado");
  }

  const initialData = await getKioscoData();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Administración</span>
            <span className="text-content-muted">/</span>
            <span className="text-content-muted">Mostrador & Stock</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content mt-1">
            Kiosco y Suplementación en Mostrador
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Registrá ventas rápidas por sucursal, administrá stock con precios de compra y venta, e integrá la recaudación al balance económico.
          </p>
        </div>
      </div>

      <KioscoClient initialData={initialData} />
    </div>
  );
}
