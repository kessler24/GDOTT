"use client";

import RecipeWorkspace from "@/components/recipe/RecipeWorkspace";
import WorkspaceMenu from "@/components/recipe/WorkspaceMenu";
import { useRecipeStore } from "@/lib/recipe/store";

export default function Home() {
  const recipe = useRecipeStore((s) => s.recipe);

  return (
    <main className="relative min-h-screen">
      <div className="absolute right-6 top-6">
        <WorkspaceMenu />
      </div>
      {recipe ? (
        <RecipeWorkspace recipe={recipe} />
      ) : (
        <div className="mx-auto max-w-2xl p-6 text-sm text-gray-500">
          No recipe loaded. Open one from Recipe History, or import a new one.
        </div>
      )}
    </main>
  );
}
