"use client";

import { useEffect } from "react";

export function InspectOverlay() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/_inspect/client.js";
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return null;
}
