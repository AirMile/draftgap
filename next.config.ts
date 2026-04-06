import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["prices-laid-accessible-tax.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
    ],
  },
};

export default nextConfig;
