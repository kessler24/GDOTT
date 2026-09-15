"use client";

import { useEffect, useRef, useState } from "react";
import { useRecipeStore } from "@/lib/recipe/store";

export default function AskAiButton() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const logGeneralAiRequest = useRecipeStore((s) => s.logGeneralAiRequest);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuestion("");
    textareaRef.current?.focus();
  }, [open]);

  // Auto-grow to fit the content — no scrolling, the whole message stays visible.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [question]);

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (trimmed.length > 0) {
      logGeneralAiRequest(trimmed);
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask AI"
        className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        Ask AI
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-lg">
            <div className="mx-auto flex max-w-2xl items-end gap-1.5 p-4">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  } else if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                placeholder="Ask AI about this recipe"
                aria-label="Ask AI about this recipe"
                rows={1}
                className="flex-1 resize-none overflow-hidden rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
              <button
                type="button"
                onClick={handleSubmit}
                aria-label="Submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-gray-900 text-white hover:bg-gray-800"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="4" y1="10" x2="16" y2="10" />
                  <polyline points="11 5 16 10 11 15" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
