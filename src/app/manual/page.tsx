import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ManualClient } from "./ManualClient";

export const metadata: Metadata = {
  title: "Manual de Usuario y Centro de Ayuda — Meraki Gym",
  description:
    "Manuales interactivos y guías de uso paso a paso para socios, entrenadores y administradores de Meraki Centro de Entrenamiento.",
};

export default async function ManualPage() {
  const currentUser = await getCurrentUser();

  return (
    <ManualClient
      userRole={currentUser?.role ?? null}
      userName={currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : undefined}
    />
  );
}
