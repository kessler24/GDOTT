import type { Recipe } from "@/lib/recipe/types";
import RecipeHeader from "./RecipeHeader";
import IngredientList from "./IngredientList";
import StepList from "./StepList";

export default function RecipeWorkspace({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <RecipeHeader recipe={recipe} />
      <IngredientList ingredients={recipe.ingredients} />
      <StepList steps={recipe.steps} />
      {recipe.equipment.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Equipment
          </h2>
          <p className="mt-2 text-sm text-gray-900">{recipe.equipment.join(", ")}</p>
        </section>
      )}
    </div>
  );
}
