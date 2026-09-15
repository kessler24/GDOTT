import { create } from "zustand";
import type { Recipe } from "./types";
import { sampleRecipe } from "./sample";

interface RecipeStore {
  recipe: Recipe;
  history: Recipe[]; // previous recipe states, most recent last — the undo stack
  savedRecipes: Recipe[];
  save: () => void;
  undo: () => void;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipe: sampleRecipe,
  history: [],
  savedRecipes: [],
  save: () => {
    const { recipe, savedRecipes } = get();
    set({ savedRecipes: [...savedRecipes, recipe] });
  },
  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({ recipe: previous, history: history.slice(0, -1) });
  },
}));
