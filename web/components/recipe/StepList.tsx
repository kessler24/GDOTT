import type { Step } from "@/lib/recipe/types";

export default function StepList({ steps }: { steps: Step[] }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Steps
      </h2>
      <ol className="mt-2 space-y-3">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
              {index + 1}
            </span>
            <span className="text-sm text-gray-900">{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
