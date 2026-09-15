import type { Ingredient } from "@/lib/recipe/types";
import IngredientRow from "./IngredientRow";
import UnitSystemToggle from "./UnitSystemToggle";

export default function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Ingredients
        </h2>
        <UnitSystemToggle />
      </div>
      <ul className="mt-2">
        {ingredients.map((ingredient) => (
          <IngredientRow key={ingredient.id} ingredient={ingredient} />
        ))}
      </ul>
    </section>
  );
}
