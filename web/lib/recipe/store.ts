import { create } from "zustand";
import type { Recipe } from "./types";
import { sampleRecipe } from "./sample";

export interface SavedRecipe {
  id: string;
  recipe: Recipe;
  savedAt: string; // ISO timestamp
  favorited: boolean;
}

interface RecipeStore {
  recipe: Recipe | null;
  undoStack: Recipe[]; // previous recipe states, most recent last
  savedRecipes: SavedRecipe[];
  newWorkspace: () => void;
  loadRecipe: (recipe: Recipe) => void;
  undo: () => void;
  toggleFavorite: (id: string) => void;
  deleteSaved: (id: string) => void;
}

function isSameRecipe(a: Recipe, b: Recipe): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function archiveCurrent(recipe: Recipe | null, savedRecipes: SavedRecipe[]): SavedRecipe[] {
  if (!recipe) return savedRecipes;
  const isDuplicate = savedRecipes.some((saved) => isSameRecipe(saved.recipe, recipe));
  if (isDuplicate) return savedRecipes;
  return [
    ...savedRecipes,
    {
      id: crypto.randomUUID(),
      recipe,
      savedAt: new Date().toISOString(),
      favorited: false,
    },
  ];
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipe: sampleRecipe,
  undoStack: [],
  savedRecipes: [],
  newWorkspace: () => {
    const { recipe, savedRecipes } = get();
    set({
      savedRecipes: archiveCurrent(recipe, savedRecipes),
      recipe: null,
      undoStack: [],
    });
  },
  loadRecipe: (nextRecipe) => {
    const { recipe, savedRecipes } = get();
    set({
      savedRecipes: archiveCurrent(recipe, savedRecipes),
      recipe: nextRecipe,
      undoStack: [],
    });
  },
  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({ recipe: previous, undoStack: undoStack.slice(0, -1) });
  },
  toggleFavorite: (id) => {
    const { savedRecipes } = get();
    set({
      savedRecipes: savedRecipes.map((saved) =>
        saved.id === id ? { ...saved, favorited: !saved.favorited } : saved,
      ),
    });
  },
  deleteSaved: (id) => {
    const { savedRecipes } = get();
    set({ savedRecipes: savedRecipes.filter((saved) => saved.id !== id) });
  },
}));
