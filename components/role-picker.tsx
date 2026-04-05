"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/lib/types";

interface RolePickerProps {
  onSelectRole: (role: Role) => void;
}

const ROLE_CHAMPIONS: Record<Role, string[]> = {
  top: [
    "Darius",
    "Garen",
    "Camille",
    "Fiora",
    "Aatrox",
    "Sett",
    "Jax",
    "Mordekaiser",
  ],
  jungle: [
    "LeeSin",
    "Viego",
    "Khazix",
    "Hecarim",
    "Graves",
    "Vi",
    "Elise",
    "JarvanIV",
  ],
  mid: ["Ahri", "Zed", "Yasuo", "Syndra", "Orianna", "Akali", "Viktor", "Yone"],
  bot: [
    "Jinx",
    "Kaisa",
    "Ezreal",
    "Jhin",
    "Caitlyn",
    "Lucian",
    "Vayne",
    "MissFortune",
  ],
  support: [
    "Thresh",
    "Lulu",
    "Nautilus",
    "Leona",
    "Pyke",
    "Morgana",
    "Blitzcrank",
    "Nami",
  ],
};

const ROLES: { value: Role; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "jungle", label: "Jungle" },
  { value: "mid", label: "Mid" },
  { value: "bot", label: "Bot" },
  { value: "support", label: "Support" },
];

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DEFAULTS: Record<Role, string> = {
  top: "Darius",
  jungle: "LeeSin",
  mid: "Ahri",
  bot: "Jinx",
  support: "Thresh",
};

function splashUrl(champion: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion}_0.jpg`;
}

export function RolePicker({ onSelectRole }: RolePickerProps) {
  const [champions, setChampions] = useState(DEFAULTS);

  useEffect(() => {
    const picked = {} as Record<Role, string>;
    for (const role of ROLES) {
      picked[role.value] = pickRandom(ROLE_CHAMPIONS[role.value]);
    }
    setChampions(picked);
  }, []);

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
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => onSelectRole(r.value)}
            className="group relative overflow-hidden rounded-2xl aspect-[5/2] sm:aspect-[2/5] transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(201,169,101,0.25)]"
          >
            <img
              src={splashUrl(champions[r.value])}
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
