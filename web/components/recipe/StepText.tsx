"use client";

import { useEffect, useRef, useState } from "react";
import { useRecipeStore } from "@/lib/recipe/store";

interface WordRange {
  start: number;
  end: number;
}

export default function StepText({ text }: { text: string }) {
  const words = text.split(" ");
  const logStepAiRequest = useRecipeStore((s) => s.logStepAiRequest);

  const [anchor, setAnchor] = useState<number | null>(null);
  const [range, setRange] = useState<WordRange | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Finish the drag no matter where the mouse is released.
  useEffect(() => {
    if (!selecting) return;
    const finish = () => {
      setSelecting(false);
      setPopoverOpen(true);
    };
    window.addEventListener("mouseup", finish);
    return () => window.removeEventListener("mouseup", finish);
  }, [selecting]);

  useEffect(() => {
    if (!popoverOpen) return;
    setQuestion("");
    textareaRef.current?.focus();
  }, [popoverOpen]);

  // Auto-grow to fit the content — no scrolling, the whole message stays visible.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [question]);

  const startSelect = (index: number) => {
    setAnchor(index);
    setRange({ start: index, end: index });
    setSelecting(true);
  };

  const extendSelect = (index: number) => {
    if (!selecting || anchor === null) return;
    setRange({ start: Math.min(anchor, index), end: Math.max(anchor, index) });
  };

  const selectAll = () => {
    setRange({ start: 0, end: words.length - 1 });
    setPopoverOpen(true);
  };

  const closePopover = () => {
    setPopoverOpen(false);
    setRange(null);
    setAnchor(null);
  };

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (trimmed.length > 0 && range) {
      logStepAiRequest(text, range.start, range.end, trimmed);
    }
    closePopover();
  };

  return (
    <span className="relative">
      <span className="select-none">
        {words.map((word, i) => {
          const isSelected = range !== null && i >= range.start && i <= range.end;
          return (
            <span key={i}>
              <span
                onMouseDown={(e) => {
                  e.preventDefault();
                  startSelect(i);
                }}
                onMouseEnter={() => extendSelect(i)}
                onDoubleClick={selectAll}
                className={`cursor-pointer rounded px-0.5 ${
                  isSelected ? "bg-yellow-200" : "hover:bg-yellow-100"
                }`}
              >
                {word}
              </span>
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
      {popoverOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={closePopover} />
          <div className="absolute left-0 top-full z-20 mt-1 flex w-80 items-end gap-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") closePopover();
              }}
              placeholder="Ask about the highlighted text"
              aria-label="Ask about the highlighted text"
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
