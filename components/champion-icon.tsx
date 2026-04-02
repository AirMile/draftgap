"use client";

import { useState } from "react";
import Image from "next/image";
import { getChampionIconUrl } from "@/lib/ddragon";

interface ChampionIconProps {
  championId: string;
  version: string;
  size?: number;
}

export function ChampionIcon({
  championId,
  version,
  size = 32,
}: ChampionIconProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400"
        title={championId}
      >
        ?
      </div>
    );
  }

  return (
    <Image
      src={getChampionIconUrl(championId, version)}
      alt={championId}
      width={size}
      height={size}
      onError={() => setHasError(true)}
    />
  );
}
