import type { Ingredient } from "./types";

// Full ingredient line, e.g. "1 lb chicken breast, sliced into strips" — used
// anywhere a reference to an ingredient needs more context than just its name.
export function formatIngredientDescription(ingredient: Ingredient): string {
  const quantityParts: string[] = [];
  if (ingredient.quantity !== null) quantityParts.push(String(ingredient.quantity));
  if (ingredient.unit) quantityParts.push(ingredient.unit);

  const namePart = `${ingredient.size ? `${ingredient.size} ` : ""}${ingredient.item}${
    ingredient.prep ? `, ${ingredient.prep}` : ""
  }`;

  return [quantityParts.join(" "), namePart].filter(Boolean).join(" ");
}
