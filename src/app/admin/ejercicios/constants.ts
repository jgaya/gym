export const GRUPOS_MUSCULARES = [
  "Core / Abdomen",
  "Bíceps",
  "Cuádriceps",
  "Espalda",
  "Femorales",
  "Glúteos",
  "Pecho",
  "Hombros",
  "Tríceps",
  "Cardio / Funcional",
] as const;

export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number];
