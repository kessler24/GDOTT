import { create } from "zustand";
import type { Recipe } from "./types";
import { sampleRecipe } from "./sample";

interface RecipeStore {
  recipe: Recipe | null;
  undoStack: Recipe[]; // previous recipe states, most recent last
  savedRecipes: Recipe[];
  newWorkspace: () => void;
  loadRecipe: (recipe: Recipe) => void;
  undo: () => void;
}

function archiveCurrent(recipe: Recipe | null, savedRecipes: Recipe[]): Recipe[] {
  return recipe ? [...savedRecipes, recipe] : savedRecipes;
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
}));
