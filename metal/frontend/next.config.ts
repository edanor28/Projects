import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
