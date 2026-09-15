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
          <div className="absolute left-0 top-full z-20 mt-1 flex w-80 items-end gap-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
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
              placeholder={label}
              aria-label={label}
              rows={1}
              className="flex-1 resize-none overflow-hidden rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            />
            <button
              type="button"
              onClick={handleSubmit}
              aria-label="Submit"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-900 text-white hover:bg-gray-800"
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
