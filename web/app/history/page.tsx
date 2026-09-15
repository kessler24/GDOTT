"use client";

import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/lib/recipe/store";
import SavedRecipeRow from "@/components/recipe/SavedRecipeRow";

export default function RecipeHistoryPage() {
  const savedRecipes = useRecipeStore((s) => s.savedRecipes);
  const loadRecipe = useRecipeStore((s) => s.loadRecipe);
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-gray-900">Recipe History</h1>
      {savedRecipes.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Recipes you save from the workspace menu will show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {savedRecipes.map((saved) => (
            <SavedRecipeRow
              key={saved.id}
              saved={saved}
              onOpen={() => {
                loadRecipe(saved.recipe);
                router.push("/");
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
