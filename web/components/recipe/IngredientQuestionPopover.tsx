"use client";

import { useEffect, useRef, useState } from "react";

export default function IngredientQuestionPopover({
  label,
  onSubmit,
  children,
}: {
  label: string;
  onSubmit: (question: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuestion("");
    inputRef.current?.focus();
  }, [open]);

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
    setOpen(false);
  };

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        className={`rounded px-0.5 ${open ? "bg-yellow-200" : "hover:bg-yellow-100"}`}
      >
        {children}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1.5 shadow-lg">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder={label}
              aria-label={label}
              className="w-48 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
            />
            <button
              type="button"
              onClick={handleSubmit}
              aria-label="Submit"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-900 text-white hover:bg-gray-800"
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
        </>
      )}
    </span>
  );
}
