"use client";

import { useRecipeStore, type UnitSystem } from "@/lib/recipe/store";

const OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: "imperial", label: "Imperial" },
  { value: "metric", label: "Metric" },
];

export default function UnitSystemToggle() {
  const unitSystem = useRecipeStore((s) => s.unitSystem);
  const setUnitSystem = useRecipeStore((s) => s.setUnitSystem);

  return (
    <div className="inline-flex rounded-md border border-gray-200 p-0.5 text-xs">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setUnitSystem(option.value)}
          aria-pressed={unitSystem === option.value}
          className={`rounded px-2 py-1 font-medium ${
            unitSystem === option.value
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
