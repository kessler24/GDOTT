"use client";

import { useEffect, useRef, useState } from "react";

export default function EditablePopover({
  value,
  label,
  onSubmit,
  children,
}: {
  value: number;
  label: string;
  onSubmit: (newValue: number) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setInput(String(value));
    inputRef.current?.focus();
    inputRef.current?.select();
    // Only re-run when the popover opens — resetting on every `value` change
    // while open would fight the user's keystrokes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = () => {
    const parsed = Number(input);
    if (Number.isFinite(parsed) && parsed > 0) {
      onSubmit(parsed);
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
          <div className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
            <input
              ref={inputRef}
              type="number"
              min="0"
              step="any"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              aria-label={label}
              className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-sm text-gray-900"
            />
          </div>
        </>
      )}
    </span>
  );
}
