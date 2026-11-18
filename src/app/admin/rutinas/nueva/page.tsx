import { Metadata } from "next";
import {
  getPlanesSelector,
  getEjerciciosParaSelector,
  getRutinasSelector,
} from "../actions";
import { RutinaEditorClient } from "../RutinaEditorClient";

export const metadata: Metadata = {
  title: "Nueva Rutina de Entrenamiento — Gym Meraki Admin",
  description: "Diseño y configuración completa de una rutina multi-día",
};

export default async function NuevaRutinaPage() {
  const [planes, ejerciciosDisponibles, rutinasExistentes] = await Promise.all([
    getPlanesSelector(),
    getEjerciciosParaSelector(),
    getRutinasSelector(),
  ]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <RutinaEditorClient
        planes={planes}
        ejerciciosDisponibles={ejerciciosDisponibles}
        rutinasExistentes={rutinasExistentes}
      />
    </div>
  );
}
