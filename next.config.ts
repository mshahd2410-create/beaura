import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/photos/[filename]": ["./app/photos/photos/**/*"],
  },
};

export default nextConfig;
