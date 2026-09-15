import type { Ingredient } from "@/lib/recipe/types";

function formatQuantity(ingredient: Ingredient): string {
  const parts: string[] = [];
  if (ingredient.quantity !== null) parts.push(String(ingredient.quantity));
  if (ingredient.unit) parts.push(ingredient.unit);
  return parts.join(" ");
}

export default function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  return (
    <li className="flex items-baseline gap-3 border-b border-gray-100 py-2 last:border-0">
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
