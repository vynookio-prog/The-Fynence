import type { NextConfig } from "next";

const insforgeUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  'https://4pzud87j.ap-southeast.insforge.app';

const insforgeKey =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
  process.env.NEXT_PUBLIC_INSFORGE_KEY ||
  'anon_751973f0bbc1cc3ab7629043f4ae19c92f102daa1067eec41de82592d2612f39';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_INSFORGE_URL: insforgeUrl,
    NEXT_PUBLIC_INSFORGE_ANON_KEY: insforgeKey,
    NEXT_PUBLIC_INSFORGE_KEY: insforgeKey,
  },
};

export default nextConfig;

