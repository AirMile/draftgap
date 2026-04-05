import { Swords } from "lucide-react";

interface LogoProps {
  size?: "sm" | "lg";
}

export function Logo({ size = "lg" }: LogoProps) {
  const isLarge = size === "lg";

  return (
    <div className="flex items-center justify-center gap-2">
      <Swords
        className={`text-accent ${isLarge ? "size-8" : "size-5"}`}
        strokeWidth={2}
      />
      <span
        className={`font-bold tracking-tight text-foreground ${isLarge ? "text-3xl sm:text-4xl" : "text-lg"}`}
      >
        DraftGap<span className="text-accent">.gg</span>
      </span>
    </div>
  );
}
