"use client";

import type { Ingredient } from "@/lib/recipe/types";
import { useRecipeStore } from "@/lib/recipe/store";
import EditablePopover from "./EditablePopover";

export default function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  const checked = useRecipeStore((s) => s.checkedIngredientIds.includes(ingredient.id));
  const toggleChecked = useRecipeStore((s) => s.toggleIngredientChecked);
  const rescaleByIngredient = useRecipeStore((s) => s.rescaleByIngredient);

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
        {ingredient.item}
        {ingredient.prep ? `, ${ingredient.prep}` : ""}
        {ingredient.optional && (
          <span className="ml-2 text-xs text-gray-400">(optional)</span>
        )}
      </span>
    </li>
  );
}
