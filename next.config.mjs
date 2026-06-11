/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcryptjs'],
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./prisma/ca.pem'],
    },
  },
};

export default nextConfig;
