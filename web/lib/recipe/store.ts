import { create } from "zustand";
import type { Recipe } from "./types";
import { sampleRecipe } from "./sample";

export interface SavedRecipe {
  id: string;
  recipe: Recipe;
  savedAt: string; // ISO timestamp
  favorited: boolean;
}

export interface KitchenItem {
  id: string;
  item: string;
  addedAt: string; // ISO timestamp
}

interface RecipeStore {
  recipe: Recipe | null;
  undoStack: Recipe[]; // previous recipe states, most recent last
  checkedIngredientIds: string[]; // ingredients marked "I have this" in the current workspace
  savedRecipes: SavedRecipe[];
  kitchenItems: KitchenItem[];
  newWorkspace: () => void;
  loadRecipe: (recipe: Recipe) => void;
  undo: () => void;
  toggleIngredientChecked: (id: string) => void;
  toggleFavorite: (id: string) => void;
  deleteSaved: (id: string) => void;
  deleteKitchenItem: (id: string) => void;
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

// Ingredients checked "I have this" get folded into My Kitchen when the recipe they
// belong to is archived — deduped by name, case-insensitively.
function addCheckedToKitchen(
  recipe: Recipe | null,
  checkedIngredientIds: string[],
  kitchenItems: KitchenItem[],
): KitchenItem[] {
  if (!recipe || checkedIngredientIds.length === 0) return kitchenItems;
  const existingNames = new Set(kitchenItems.map((k) => k.item.toLowerCase()));
  const additions: KitchenItem[] = [];
  for (const ingredient of recipe.ingredients) {
    if (!checkedIngredientIds.includes(ingredient.id)) continue;
    const key = ingredient.item.toLowerCase();
    if (existingNames.has(key)) continue;
    existingNames.add(key);
    additions.push({
      id: crypto.randomUUID(),
      item: ingredient.item,
      addedAt: new Date().toISOString(),
    });
  }
  return additions.length > 0 ? [...kitchenItems, ...additions] : kitchenItems;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipe: sampleRecipe,
  undoStack: [],
  checkedIngredientIds: [],
  savedRecipes: [],
  kitchenItems: [],
  newWorkspace: () => {
    const { recipe, savedRecipes, checkedIngredientIds, kitchenItems } = get();
    set({
      savedRecipes: archiveCurrent(recipe, savedRecipes),
      kitchenItems: addCheckedToKitchen(recipe, checkedIngredientIds, kitchenItems),
      recipe: null,
      checkedIngredientIds: [],
      undoStack: [],
    });
  },
  loadRecipe: (nextRecipe) => {
    const { recipe, savedRecipes, checkedIngredientIds, kitchenItems } = get();
    set({
      savedRecipes: archiveCurrent(recipe, savedRecipes),
      kitchenItems: addCheckedToKitchen(recipe, checkedIngredientIds, kitchenItems),
      recipe: nextRecipe,
      checkedIngredientIds: [],
      undoStack: [],
    });
  },
  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({ recipe: previous, undoStack: undoStack.slice(0, -1) });
  },
  toggleIngredientChecked: (id) => {
    const { checkedIngredientIds } = get();
    set({
      checkedIngredientIds: checkedIngredientIds.includes(id)
        ? checkedIngredientIds.filter((existing) => existing !== id)
        : [...checkedIngredientIds, id],
    });
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
  deleteKitchenItem: (id) => {
    const { kitchenItems } = get();
    set({ kitchenItems: kitchenItems.filter((item) => item.id !== id) });
  },
}));
