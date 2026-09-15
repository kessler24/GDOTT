"use client";

import { useRecipeStore } from "@/lib/recipe/store";

export default function MyKitchenPage() {
  const kitchenItems = useRecipeStore((s) => s.kitchenItems);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-gray-900">My Kitchen</h1>
      {kitchenItems.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Check off ingredients you have in the workspace, then save the recipe —
          they&apos;ll show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {kitchenItems.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-gray-200 p-3 text-sm text-gray-900"
            >
              {item.item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
