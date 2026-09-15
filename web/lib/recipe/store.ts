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

export type UnitSystem = "imperial" | "metric";

// "substitution" and "open-ended" both land here as "ai-request" for now — without a
// model in the loop there is no way to tell them apart, so we log what was asked
// rather than guessing at intent.
export type ChangeLogEntryType = "servings" | "quantity" | "unit-conversion" | "ai-request";

export interface StepHighlight {
  fullText: string;
  wordStart: number; // inclusive index into fullText.split(" ")
  wordEnd: number; // inclusive
}

export interface ChangeLogEntry {
  id: string;
  type: ChangeLogEntryType;
  summary: string;
  createdAt: string; // ISO timestamp
  undone: boolean;
  // Present only for step-anchored AI requests — lets the history panel render the
  // full step with the asked-about words highlighted, same as the live step text.
  question?: string;
  stepHighlight?: StepHighlight;
}

interface UndoEntry {
  recipe: Recipe;
  changeEntryId: string; // the changeLog entry this snapshot reverts
}

interface RecipeStore {
  recipe: Recipe | null;
  undoStack: UndoEntry[]; // previous recipe states, most recent last
  checkedIngredientIds: string[]; // ingredients marked "I have this" in the current workspace
  savedRecipes: SavedRecipe[];
  kitchenItems: KitchenItem[];
  unitSystem: UnitSystem;
  changeLog: ChangeLogEntry[];
  setUnitSystem: (system: UnitSystem) => void;
  newWorkspace: () => void;
  loadRecipe: (recipe: Recipe) => void;
  undo: () => void;
  toggleIngredientChecked: (id: string) => void;
  toggleFavorite: (id: string) => void;
  deleteSaved: (id: string) => void;
  deleteKitchenItem: (id: string) => void;
  rescaleByServings: (newServings: number) => void;
  rescaleByIngredient: (ingredientId: string, newQuantity: number) => void;
  logAiRequest: (subject: string, question: string) => void;
  logStepAiRequest: (fullText: string, wordStart: number, wordEnd: number, question: string) => void;
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

function makeLogEntry(type: ChangeLogEntryType, summary: string): ChangeLogEntry {
  return {
    id: crypto.randomUUID(),
    type,
    summary,
    createdAt: new Date().toISOString(),
    undone: false,
  };
}

function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundServings(value: number): number {
  return Math.max(1, Math.round(value));
}

// Linear ingredient-anchored/servings-anchored rescale — every quantity moves by the
// same factor. Nonlinear cases (leaveners, salt, bake times) are a deliberate MVP gap.
function scaleRecipe(recipe: Recipe, factor: number, newServings: number | null): Recipe {
  return {
    ...recipe,
    servings: newServings !== null ? roundServings(newServings) : recipe.servings,
    ingredients: recipe.ingredients.map((ingredient) =>
      ingredient.quantity !== null
        ? { ...ingredient, quantity: roundQuantity(ingredient.quantity * factor) }
        : ingredient,
    ),
  };
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipe: sampleRecipe,
  undoStack: [],
  checkedIngredientIds: [],
  savedRecipes: [],
  kitchenItems: [],
  unitSystem: "imperial",
  changeLog: [],
  setUnitSystem: (system) => {
    const { unitSystem, changeLog } = get();
    if (system === unitSystem) return;
    set({
      unitSystem: system,
      changeLog: [...changeLog, makeLogEntry("unit-conversion", `Switched to ${system}`)],
    });
  },
  newWorkspace: () => {
    const { recipe, savedRecipes, checkedIngredientIds, kitchenItems } = get();
    set({
      savedRecipes: archiveCurrent(recipe, savedRecipes),
      kitchenItems: addCheckedToKitchen(recipe, checkedIngredientIds, kitchenItems),
      recipe: null,
      checkedIngredientIds: [],
      undoStack: [],
      changeLog: [],
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
      changeLog: [],
    });
  },
  undo: () => {
    const { undoStack, changeLog } = get();
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    set({
      recipe: last.recipe,
      undoStack: undoStack.slice(0, -1),
      changeLog: changeLog.map((entry) =>
        entry.id === last.changeEntryId ? { ...entry, undone: true } : entry,
      ),
    });
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
  rescaleByServings: (newServings) => {
    const { recipe, undoStack, changeLog } = get();
    if (!recipe || recipe.servings === null || recipe.servings <= 0) return;
    const factor = newServings / recipe.servings;
    const roundedServings = roundServings(newServings);
    const entry = makeLogEntry(
      "servings",
      `Changed servings from ${recipe.servings} to ${roundedServings}`,
    );
    set({
      recipe: scaleRecipe(recipe, factor, newServings),
      undoStack: [...undoStack, { recipe, changeEntryId: entry.id }],
      changeLog: [...changeLog, entry],
    });
  },
  rescaleByIngredient: (ingredientId, newQuantity) => {
    const { recipe, undoStack, changeLog } = get();
    if (!recipe) return;
    const anchor = recipe.ingredients.find((ingredient) => ingredient.id === ingredientId);
    if (!anchor || anchor.quantity === null || anchor.quantity <= 0) return;
    const factor = newQuantity / anchor.quantity;
    const newServings = recipe.servings !== null ? recipe.servings * factor : null;
    const unitSuffix = anchor.unit ? ` ${anchor.unit}` : "";
    const entry = makeLogEntry(
      "quantity",
      `Changed ${anchor.item} from ${anchor.quantity}${unitSuffix} to ${roundQuantity(newQuantity)}${unitSuffix}`,
    );
    set({
      recipe: scaleRecipe(recipe, factor, newServings),
      undoStack: [...undoStack, { recipe, changeEntryId: entry.id }],
      changeLog: [...changeLog, entry],
    });
  },
  logAiRequest: (subject, question) => {
    const { recipe, undoStack, changeLog } = get();
    if (!recipe) return;
    const entry = makeLogEntry("ai-request", `Asked about "${subject}": ${question}`);
    set({
      undoStack: [...undoStack, { recipe, changeEntryId: entry.id }],
      changeLog: [...changeLog, entry],
    });
  },
  logStepAiRequest: (fullText, wordStart, wordEnd, question) => {
    const { recipe, undoStack, changeLog } = get();
    if (!recipe) return;
    const highlighted = fullText.split(" ").slice(wordStart, wordEnd + 1).join(" ");
    const entry = makeLogEntry("ai-request", `Asked about "${highlighted}": ${question}`);
    set({
      undoStack: [...undoStack, { recipe, changeEntryId: entry.id }],
      changeLog: [
        ...changeLog,
        { ...entry, question, stepHighlight: { fullText, wordStart, wordEnd } },
      ],
    });
  },
}));
