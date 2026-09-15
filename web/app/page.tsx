import RecipeWorkspace from "@/components/recipe/RecipeWorkspace";
import { sampleRecipe } from "@/lib/recipe/sample";

export default function Home() {
  return (
    <main className="min-h-screen">
      <RecipeWorkspace recipe={sampleRecipe} />
    </main>
  );
}
