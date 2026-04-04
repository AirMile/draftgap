"use client";

import type { Role } from "@/lib/types";

interface RolePickerProps {
  onSelectRole: (role: Role) => void;
}

const ROLE_CARDS: { value: Role; label: string; champion: string }[] = [
  { value: "top", label: "Top", champion: "Darius" },
  { value: "jungle", label: "Jungle", champion: "LeeSin" },
  { value: "mid", label: "Mid", champion: "Ahri" },
  { value: "bot", label: "Bot", champion: "Jinx" },
  { value: "support", label: "Support", champion: "Thresh" },
];

function splashUrl(champion: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion}_0.jpg`;
}

export function RolePicker({ onSelectRole }: RolePickerProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-6 sm:gap-0 animate-fade-in">
      <div className="text-center sm:hidden">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          Pool Optimizer
        </h1>
        <p className="text-muted text-sm">Select your role to get started</p>
      </div>
      <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-5 w-full max-w-md sm:max-w-4xl">
        <div className="absolute inset-x-0 -top-28 text-center pointer-events-none hidden sm:block">
          <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">
            Pool Optimizer
          </h1>
          <p className="text-muted text-base">
            Select your role to get started
          </p>
        </div>
        {ROLE_CARDS.map((r) => (
          <button
            key={r.value}
            onClick={() => onSelectRole(r.value)}
            className="group relative overflow-hidden rounded-2xl aspect-[5/2] sm:aspect-[2/5] transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(201,169,101,0.25)]"
          >
            <img
              src={splashUrl(r.champion)}
              alt={r.label}
              className="absolute inset-0 w-full h-full object-cover object-[center_20%] sm:object-top transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            />
            <div className="absolute inset-x-0 -bottom-1 bg-black/60 backdrop-blur-sm py-2.5 sm:py-3 flex justify-center rounded-b-2xl">
              <span className="text-base sm:text-xl font-bold text-white tracking-wide group-hover:text-accent transition-colors duration-300">
                {r.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
