"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FONT_STEPS,
  DEFAULT_FONT_STEP_INDEX,
  FONT_SIZE_STORAGE_KEY,
  FONT_SIZE_CHANGE_EVENT,
  getStoredFontSizeIndex,
  applyGlobalFontSize,
} from "./fontSize";

export function useFontSize() {
  const [stepIndex, setStepIndex] = useState<number>(DEFAULT_FONT_STEP_INDEX);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialIndex = getStoredFontSizeIndex();
    setStepIndex(initialIndex);
    document.documentElement.style.fontSize = `${FONT_STEPS[initialIndex].value}%`;

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (typeof customEvent.detail?.index === "number") {
        setStepIndex(customEvent.detail.index);
      } else {
        setStepIndex(getStoredFontSizeIndex());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FONT_SIZE_STORAGE_KEY) {
        const updatedIndex = getStoredFontSizeIndex();
        setStepIndex(updatedIndex);
        document.documentElement.style.fontSize = `${FONT_STEPS[updatedIndex].value}%`;
      }
    };

    window.addEventListener(FONT_SIZE_CHANGE_EVENT, handleCustomChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(FONT_SIZE_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setFontSizeIndex = useCallback((index: number) => {
    const applied = applyGlobalFontSize(index);
    setStepIndex(applied);
  }, []);

  const resetFontSize = useCallback(() => {
    const applied = applyGlobalFontSize(DEFAULT_FONT_STEP_INDEX);
    setStepIndex(applied);
  }, []);

  return {
    stepIndex,
    currentStep: FONT_STEPS[stepIndex],
    mounted,
    setFontSizeIndex,
    resetFontSize,
  };
}
