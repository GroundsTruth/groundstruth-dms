/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint config is added in a follow-up step; don't block the dev/build loop on it yet.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
