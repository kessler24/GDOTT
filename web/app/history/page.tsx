"use client";

import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/lib/recipe/store";
import type { Recipe } from "@/lib/recipe/types";

export default function RecipeHistoryPage() {
  const savedRecipes = useRecipeStore((s) => s.savedRecipes);
  const loadRecipe = useRecipeStore((s) => s.loadRecipe);
  const router = useRouter();

  const handleOpen = (recipe: Recipe) => {
    loadRecipe(recipe);
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-gray-900">Recipe History</h1>
      {savedRecipes.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Recipes you save from the workspace menu will show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {savedRecipes.map((recipe, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => handleOpen(recipe)}
                className="w-full rounded-md border border-gray-200 p-3 text-left text-sm text-gray-900 hover:bg-gray-50"
              >
                {recipe.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
