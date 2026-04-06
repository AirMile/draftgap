"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/lib/types";
import { Logo } from "@/components/logo";

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

import { ROLES } from "@/components/role-selector";

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

function loadingUrl(champion: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion}_0.jpg`;
}

function splashUrl(champion: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion}_0.jpg`;
}

function RoleSplash({
  loading,
  splash,
  alt,
  eager,
}: {
  loading: string;
  splash: string;
  alt: string;
  eager: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <picture>
      <source media="(min-width: 640px)" srcSet={loading} />
      <img
        src={splash}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center sm:object-top transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </picture>
  );
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
        <h1>
          <Logo />
        </h1>
        <p className="text-muted text-sm mt-2">Select your role</p>
      </div>
      <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-5 w-full max-w-md sm:max-w-4xl">
        <div className="absolute inset-x-0 -top-28 text-center pointer-events-none hidden sm:block">
          <h1>
            <Logo />
          </h1>
          <p className="text-muted text-lg mt-2 tracking-wide">
            Select your role
          </p>
        </div>
        {ROLES.map((r, i) => (
          <button
            key={r.value}
            onClick={() => onSelectRole(r.value)}
            className="group relative overflow-hidden rounded-2xl aspect-[16/9] sm:aspect-[2/5] transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(201,169,101,0.25)]"
          >
            <RoleSplash
              loading={loadingUrl(champions[r.value])}
              splash={splashUrl(champions[r.value])}
              alt={`${r.label} — ${champions[r.value]}`}
              eager={i < 3}
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
