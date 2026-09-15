"use client";

import type { Ingredient } from "@/lib/recipe/types";
import { useRecipeStore } from "@/lib/recipe/store";
import { formatIngredientDescription } from "@/lib/recipe/format";
import EditablePopover from "./EditablePopover";
import IngredientQuestionPopover from "./IngredientQuestionPopover";

export default function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  const checked = useRecipeStore((s) => s.checkedIngredientIds.includes(ingredient.id));
  const toggleChecked = useRecipeStore((s) => s.toggleIngredientChecked);
  const rescaleByIngredient = useRecipeStore((s) => s.rescaleByIngredient);
  const logAiRequest = useRecipeStore((s) => s.logAiRequest);
  const ingredientDescription = formatIngredientDescription(ingredient);

  return (
    <li className="flex items-baseline gap-3 border-b border-gray-100 py-2 last:border-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleChecked(ingredient.id)}
        aria-label={`I have ${ingredient.item}`}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
      />
      <span className="flex w-20 shrink-0 items-center gap-1 text-sm text-gray-500">
        {ingredient.quantity !== null && (
          <EditablePopover
            value={ingredient.quantity}
            label={`Quantity for ${ingredient.item}`}
            onSubmit={(newQuantity) => rescaleByIngredient(ingredient.id, newQuantity)}
          >
            {ingredient.quantity}
          </EditablePopover>
        )}
        {ingredient.unit && <span>{ingredient.unit}</span>}
      </span>
      <span className="text-sm text-gray-900">
        {ingredient.size ? `${ingredient.size} ` : ""}
        <IngredientQuestionPopover
          label={`Ask about ${ingredient.item}`}
          onSubmit={(question) => logAiRequest(ingredientDescription, question)}
        >
          {ingredient.item}
        </IngredientQuestionPopover>
        {ingredient.prep && (
          <>
            {", "}
            <IngredientQuestionPopover
              label={`Ask about ${ingredient.prep}`}
              onSubmit={(question) => logAiRequest(ingredientDescription, question)}
            >
              {ingredient.prep}
            </IngredientQuestionPopover>
          </>
        )}
        {ingredient.optional && (
          <span className="ml-2 text-xs text-gray-400">(optional)</span>
        )}
      </span>
    </li>
  );
}
