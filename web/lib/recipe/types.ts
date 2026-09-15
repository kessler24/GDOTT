export interface Ingredient {
  id: string; // stable across edits — never keyed on list position
  quantity: number | null;
  unit: string | null;
  item: string;
  prep: string | null; // "finely diced"
  optional: boolean;
  size: string | null; // "medium" — what a count-to-weight conversion keys off
  substitutedFrom: string | null; // provenance, shown on the change highlight
  originalText: string | null; // as parsed, before any convert/rescale
}

export interface Step {
  id: string;
  text: string;
  ingredientRefs: string[]; // ingredient ids mentioned in this step
}

export interface RecipeTime {
  prepMin: number | null;
  cookMin: number | null;
  totalMin: number | null;
}

export interface Recipe {
  title: string;
  sourceUrl: string | null;
  servings: number | null;
  time: RecipeTime;
  ingredients: Ingredient[];
  steps: Step[];
  equipment: string[];
  notes: string[];
}
