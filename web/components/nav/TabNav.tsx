"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Workspace" },
  { href: "/history", label: "Recipe History" },
  { href: "/kitchen", label: "My Kitchen" },
  { href: "/settings", label: "Settings" },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200">
      <div className="mx-auto flex max-w-2xl gap-6 px-6">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
