import type { Ingredient } from "@/lib/recipe/types";
import IngredientRow from "./IngredientRow";

export default function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Ingredients
      </h2>
      <ul className="mt-2">
        {ingredients.map((ingredient) => (
          <IngredientRow key={ingredient.id} ingredient={ingredient} />
        ))}
      </ul>
    </section>
  );
}
