import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Disambiguate from the Cowork-root package-lock.json
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
