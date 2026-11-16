export interface FontStep {
  value: number;
  label: string;
  tag: string;
}

export const FONT_STEPS: FontStep[] = [
  { value: 90, label: "90%", tag: "Reducido" },
  { value: 100, label: "100%", tag: "Estándar" },
  { value: 105, label: "105%", tag: "Cómodo" },
  { value: 110, label: "110%", tag: "Medio" },
  { value: 120, label: "120%", tag: "Aumentado" },
  { value: 150, label: "150%", tag: "Grande" },
];

export const DEFAULT_FONT_STEP_INDEX = 1; // 100%
export const FONT_SIZE_STORAGE_KEY = "gym-font-size";
export const FONT_SIZE_CHANGE_EVENT = "gym-font-size-change";

export function getStoredFontSizeIndex(): number {
  try {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored) {
      const numeric = parseInt(stored, 10);
      const foundIndex = FONT_STEPS.findIndex((s) => s.value === numeric);
      if (foundIndex !== -1) {
        return foundIndex;
      }
    }
  } catch {
    // Ignorar errores en modo privado/incógnito
  }
  return DEFAULT_FONT_STEP_INDEX;
}

export function applyGlobalFontSize(index: number): number {
  const clampedIndex = Math.max(0, Math.min(FONT_STEPS.length - 1, index));
  const chosenStep = FONT_STEPS[clampedIndex];

  try {
    document.documentElement.style.fontSize = `${chosenStep.value}%`;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, `${chosenStep.value}%`);
    window.dispatchEvent(
      new CustomEvent(FONT_SIZE_CHANGE_EVENT, { detail: { index: clampedIndex } })
    );
  } catch {
    // Fallback si localStorage o window falla
  }

  return clampedIndex;
}
