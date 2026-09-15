"use client";

import { useRecipeStore, type ChangeLogEntryType } from "@/lib/recipe/store";

const TYPE_LABELS: Record<ChangeLogEntryType, string> = {
  servings: "Serving Size",
  quantity: "Ingredient Quantity",
  "unit-conversion": "Unit Conversion",
  "ai-request": "AI Request",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ChangeHistoryPanel({ onClose }: { onClose: () => void }) {
  const changeLog = useRecipeStore((s) => s.changeLog);
  const entries = [...changeLog].reverse();

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-40 max-h-[60vh] overflow-y-auto rounded-t-lg border-t border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-2xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">History</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history"
              className="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="h-4 w-4"
              >
                <line x1="5" y1="5" x2="15" y2="15" />
                <line x1="15" y1="5" x2="5" y2="15" />
              </svg>
            </button>
          </div>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No changes yet this session.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {TYPE_LABELS[entry.type]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(entry.createdAt)}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-sm ${
                      entry.undone ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {entry.summary}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
