import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acceder al servidor de desarrollo y recursos de Next.js (HMR) desde la red local
  allowedDevOrigins: [
    "192.168.0.106",
    "*.192.168.0.106",
    "localhost",
    "127.0.0.1",
  ],
  // Permite invocar Server Actions (login, formularios, etc.) desde la IP local
  experimental: {
    serverActions: {
      allowedOrigins: [
        "192.168.0.106:3000",
        "192.168.0.106",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },
};

export default nextConfig;
