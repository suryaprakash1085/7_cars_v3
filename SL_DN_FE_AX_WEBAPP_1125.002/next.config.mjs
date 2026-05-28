/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: process.cwd(),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
