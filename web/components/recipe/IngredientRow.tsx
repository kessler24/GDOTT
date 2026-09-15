"use client";

import type { Ingredient } from "@/lib/recipe/types";
import { useRecipeStore } from "@/lib/recipe/store";

function formatQuantity(ingredient: Ingredient): string {
  const parts: string[] = [];
  if (ingredient.quantity !== null) parts.push(String(ingredient.quantity));
  if (ingredient.unit) parts.push(ingredient.unit);
  return parts.join(" ");
}

export default function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  const checked = useRecipeStore((s) => s.checkedIngredientIds.includes(ingredient.id));
  const toggleChecked = useRecipeStore((s) => s.toggleIngredientChecked);

  return (
    <li className="flex items-baseline gap-3 border-b border-gray-100 py-2 last:border-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleChecked(ingredient.id)}
        aria-label={`I have ${ingredient.item}`}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
      />
      <span className="w-20 shrink-0 text-sm text-gray-500">
        {formatQuantity(ingredient)}
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
