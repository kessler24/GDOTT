import type { Recipe } from "@/lib/recipe/types";

export default function RecipeHeader({ recipe }: { recipe: Recipe }) {
  const { title, servings, time } = recipe;
  const timeParts = [
    time.prepMin !== null ? `Prep ${time.prepMin} min` : null,
    time.cookMin !== null ? `Cook ${time.cookMin} min` : null,
    time.totalMin !== null ? `Total ${time.totalMin} min` : null,
  ].filter((part): part is string => part !== null);

  return (
    <header className="border-b border-gray-200 pb-4">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-500">
        {servings !== null && <span>Serves {servings}</span>}
        {timeParts.map((part) => (
          <span key={part}>{part}</span>
        ))}
      </div>
    </header>
  );
}
