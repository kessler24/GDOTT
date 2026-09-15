"use client";

import { useState } from "react";

const IMPORT_OPTIONS = [
  "Add a link",
  "Upload a PDF or document",
  "Ask AI to find or create a recipe",
];

export default function ImportRecipeButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Import Recipe
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute left-1/2 z-20 mt-2 w-56 -translate-x-1/2 rounded-md border border-gray-200 bg-white py-1 text-left shadow-lg"
          >
            {IMPORT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
