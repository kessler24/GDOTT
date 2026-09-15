"use client";

import { useState } from "react";
import { useRecipeStore, type KitchenItem } from "@/lib/recipe/store";

export default function KitchenItemRow({ item }: { item: KitchenItem }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deleteKitchenItem = useRecipeStore((s) => s.deleteKitchenItem);

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-gray-200 p-3">
      <span className="text-sm text-gray-900">{item.item}</span>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Item options"
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
              className="absolute right-0 z-20 mt-2 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  deleteKitchenItem(item.id);
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
