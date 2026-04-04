"use client";

import type { Role } from "@/lib/types";

export const ROLES: { value: Role; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "jungle", label: "Jungle" },
  { value: "mid", label: "Mid" },
  { value: "bot", label: "Bot" },
  { value: "support", label: "Support" },
];

interface RoleSelectorProps {
  role: Role | null;
  onRoleChange: (role: Role) => void;
}

export function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="inline-flex gap-1 bg-background border border-card-border rounded-lg p-1">
      {ROLES.map((r) => (
        <button
          key={r.value}
          onClick={() => onRoleChange(r.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            role === r.value
              ? "bg-accent/15 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
