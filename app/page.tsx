"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePool } from "@/lib/use-pool";
import { PoolInput } from "@/components/pool-input";
import roleMapping from "@/data/role-mapping.json";

const DDRAGON_VERSION = "14.10.1";

export default function Home() {
  const router = useRouter();
  const {
    pool,
    loaded,
    isValid,
    setRole,
    addChampion,
    removeChampion,
    maxChampions,
  } = usePool();

  const [championsForRole, setChampionsForRole] = useState<string[]>([]);

  useEffect(() => {
    if (!pool?.role) {
      setChampionsForRole([]);
      return;
    }
    const role = pool.role;
    const filtered = Object.entries(roleMapping)
      .filter(([, roles]) => (roles as string[]).includes(role))
      .map(([name]) => name)
      .sort();
    setChampionsForRole(filtered);
  }, [pool?.role]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-accent mb-2">
          LoL Pool Optimizer
        </h1>
        <p className="text-muted mb-8">
          Selecteer je role en champion pool om je matchups te analyseren.
        </p>

        <PoolInput
          role={pool?.role ?? null}
          champions={pool?.champions ?? []}
          allChampions={championsForRole}
          version={DDRAGON_VERSION}
          maxChampions={maxChampions}
          onRoleChange={setRole}
          onAddChampion={addChampion}
          onRemoveChampion={removeChampion}
        />

        <div className="mt-8">
          <button
            onClick={() => router.push("/pool")}
            disabled={!isValid}
            className={`w-full py-3 rounded-lg font-medium text-lg transition-colors ${
              isValid
                ? "bg-accent text-background hover:bg-accent-dim cursor-pointer"
                : "bg-card border border-card-border text-muted cursor-not-allowed"
            }`}
          >
            {isValid
              ? "Analyseer Matchups"
              : `Selecteer minimaal 2 champions${pool?.role ? "" : " en een role"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
