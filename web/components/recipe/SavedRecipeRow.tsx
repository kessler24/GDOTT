"use client";

import { useState } from "react";
import { useRecipeStore, type SavedRecipe } from "@/lib/recipe/store";

function formatSavedAt(savedAt: string): string {
  return new Date(savedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SavedRecipeRow({
  saved,
  onOpen,
}: {
  saved: SavedRecipe;
  onOpen: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite);
  const deleteSaved = useRecipeStore((s) => s.deleteSaved);

  return (
    <li className="flex items-center gap-2 rounded-md border border-gray-200 p-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-baseline justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm text-gray-900">
          {saved.favorited && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-red-500"
            >
              <path d="M10 17.25l-1.318-1.2C4.4 12.36 2 10.19 2 7.5 2 5.42 3.42 4 5.5 4c1.24 0 2.43.59 3.19 1.5H11.3c.76-.91 1.95-1.5 3.19-1.5C16.58 4 18 5.42 18 7.5c0 2.69-2.4 4.86-6.68 8.55L10 17.25z" />
            </svg>
          )}
          {saved.recipe.title}
        </span>
        <span className="shrink-0 text-xs text-gray-400">{formatSavedAt(saved.savedAt)}</span>
      </button>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Recipe options"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toggleFavorite(saved.id);
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {saved.favorited ? "Unfavorite" : "Favorite"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  deleteSaved(saved.id);
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
