"use client";

import { useState } from "react";
import { useRecipeStore } from "@/lib/recipe/store";

export default function WorkspaceMenu() {
  const [open, setOpen] = useState(false);
  const save = useRecipeStore((s) => s.save);
  const undo = useRecipeStore((s) => s.undo);
  const canUndo = useRecipeStore((s) => s.history.length > 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        Menu
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                save();
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Save
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!canUndo}
              onClick={() => {
                undo();
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              Undo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
