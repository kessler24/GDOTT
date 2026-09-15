"use client";

import { useRecipeStore } from "@/lib/recipe/store";

export default function RecipeHistoryPage() {
  const savedRecipes = useRecipeStore((s) => s.savedRecipes);

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
            <li
              key={index}
              className="rounded-md border border-gray-200 p-3 text-sm text-gray-900"
            >
              {recipe.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
