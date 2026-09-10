import type { NextConfig } from "next";

// NEXT_OUTPUT=export produit un site statique dans `out/`, servi par l'API
// FastAPI sur la même URL. Sans cette variable, le mode serveur reste inchangé.
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = isStaticExport
  ? { output: "export", trailingSlash: true }
  : {};

export default nextConfig;
