import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getRutinaCompletaParaEditar,
  getPlanesSelector,
  getEjerciciosParaSelector,
  getRutinasSelector,
} from "../actions";
import { RutinaEditorClient } from "../RutinaEditorClient";

interface EditarRutinaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: EditarRutinaPageProps): Promise<Metadata> {
  const { id } = await params;
  const rutina = await getRutinaCompletaParaEditar(Number(id));
  return {
    title: rutina
      ? `Editar: ${rutina.nombre} — Gym Meraki Admin`
      : "Editar Rutina — Gym Meraki Admin",
  };
}

export default async function EditarRutinaPage({ params }: EditarRutinaPageProps) {
  const { id } = await params;
  const rutinaId = Number(id);

  if (isNaN(rutinaId)) {
    notFound();
  }

  const [initialData, planes, ejerciciosDisponibles, rutinasExistentes] =
    await Promise.all([
      getRutinaCompletaParaEditar(rutinaId),
      getPlanesSelector(),
      getEjerciciosParaSelector(),
      getRutinasSelector(),
    ]);

  if (!initialData) {
    notFound();
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <RutinaEditorClient
        initialData={initialData}
        planes={planes}
        ejerciciosDisponibles={ejerciciosDisponibles}
        rutinasExistentes={rutinasExistentes}
      />
    </div>
  );
}
