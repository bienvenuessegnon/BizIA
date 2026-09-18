import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isole le cache de développement (.next-dev) du build de production (.next)
  // pour éliminer définitivement les conflits de chunks "Cannot find module"
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;

