"use client";

import { useRecipeStore } from "@/lib/recipe/store";
import IngredientQuestionPopover from "./IngredientQuestionPopover";

export default function EquipmentList({ equipment }: { equipment: string[] }) {
  const logAiRequest = useRecipeStore((s) => s.logAiRequest);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Equipment
      </h2>
      <div className="mt-2 text-sm text-gray-900">
        {equipment.map((item, i) => (
          <span key={`${item}-${i}`}>
            <IngredientQuestionPopover
              label={`Ask about ${item}`}
              onSubmit={(question) => logAiRequest(item, question)}
            >
              {item}
            </IngredientQuestionPopover>
            {i < equipment.length - 1 ? ", " : ""}
          </span>
        ))}
      </div>
    </section>
  );
}
