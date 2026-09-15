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
      <RecipeWorkspace recipe={recipe} />
    </main>
  );
}
