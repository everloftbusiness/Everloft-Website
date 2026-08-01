import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next.js defaults Server Action request bodies to 1MB, which silently
    // capped every photo upload (property-images allows up to 25MB per
    // lib/storage/r2.ts) — this was the real cause of the "1MB limit" bug,
    // not the storage layer. 30MB covers the 25MB image limit with headroom
    // for multipart overhead.
    serverActions: { bodySizeLimit: "30mb" },
  },
};

export default nextConfig;
