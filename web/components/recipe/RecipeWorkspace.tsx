import type { Recipe } from "@/lib/recipe/types";
import RecipeHeader from "./RecipeHeader";
import IngredientList from "./IngredientList";
import StepList from "./StepList";
import EquipmentList from "./EquipmentList";

export default function RecipeWorkspace({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <RecipeHeader recipe={recipe} />
      <IngredientList ingredients={recipe.ingredients} />
      <StepList steps={recipe.steps} />
      {recipe.equipment.length > 0 && <EquipmentList equipment={recipe.equipment} />}
    </div>
  );
}
